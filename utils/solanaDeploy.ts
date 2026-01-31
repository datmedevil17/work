import { 
    Connection, 
    Keypair, 
    PublicKey, 
    SystemProgram, 
    Transaction, 
    TransactionInstruction,
    sendAndConfirmTransaction,
    Signer,
    ComputeBudgetProgram
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

// BPF Loader Program ID (Loader 2)
const BPF_LOADER_PROGRAM_ID = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");

interface DeployProgress {
    status: string;
    progress?: number;
    total?: number;
    txId?: string;
}

export const deployProgram = async (
    connection: Connection,
    wallet: WalletContextState,
    binary: Uint8Array,
    onProgress: (log: string) => void
): Promise<string> => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
        throw new Error("Wallet not connected");
    }

    onProgress("Starting client-side deployment...");
    onProgress(`Binary size: ${binary.length} bytes`);

    // 1. Calculate buffer account size
    // For simplicity in this demo, we'll try to do a fresh deploy.
    // In production, this logic is much more complex (Buffer account management, etc.)
    
    // We will use a simplified approach:
    // 1. Create a Buffer Account
    // 2. Write data in chunks
    // 3. Deploy
    
    const bufferKeypair = Keypair.generate();
    const programKeypair = Keypair.generate();
    
    onProgress(`Creating Buffer Account: ${bufferKeypair.publicKey.toBase58()}`);
    
    let rentExemption = 0;
    try {
        rentExemption = await connection.getMinimumBalanceForRentExemption(binary.length + 45); // + overhead
    } catch(e) {
        throw new Error(`RPC Connection failed. Ensure your Validator is running. Details: ${e}`);
    }
    
    // Chunk size: ~1KB to be safe with MTU and transaction size limits
    const CHUNK_SIZE = 900; 
    const chunks = Math.ceil(binary.length / CHUNK_SIZE);
    
    // Create Buffer Account Instruction
    const createBufferIx = SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: bufferKeypair.publicKey,
        lamports: rentExemption,
        space: binary.length + 45, // approx header size
        programId: BPF_LOADER_PROGRAM_ID
    });
    
    // Initialize Buffer Instruction (this concept is specific to Upgradeable Loader)
    // Actually the BPF Loader Upgradeable requires a specific instruction to initialize the buffer.
    // However, constructing raw instructions for BPF Loader is tricky without the IDL or specialized library.
    // 
    // ALTERNATIVE:
    // Since implementing the full raw BPF Loader protocol in frontend is very error-prone and complex 
    // (requires serializing instructions exactly as the loader expects),
    // we might want to flag this complexity.
    //
    // BUT, for this task, I will attempt a "simulated" deployment or a simpler standard deployment if possible.
    // Real "solana program deploy" uses the CLI which has complex logic.
    //
    // Let's implement the standard "Write" loop which is universal for these loaders.
    
    // WARNING: The BPF Upgradeable Loader Instruction layout is:
    // 0: InitializeBuffer
    // 1: Write
    // 2: DeployWithMaxDataLen
    // 3: Upgrade
    // 4: SetAuthority
    // 5: Close
    
    // We need to manually construct these instructions.
    
    // Instruction 0: Initialize Buffer
    const initBufferData = Buffer.alloc(4);
    initBufferData.writeUInt32LE(0, 0);
    const initBufferIx = new TransactionInstruction({
        keys: [
            { pubkey: bufferKeypair.publicKey, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: false, isWritable: false }, // authority
        ],
        programId: BPF_LOADER_PROGRAM_ID,
        data: initBufferData
    });
    
    // Transaction 1: Create Account + Init Buffer
    const initTx = new Transaction().add(createBufferIx, initBufferIx);
    initTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    initTx.feePayer = wallet.publicKey;
    initTx.sign(bufferKeypair); // Sign with new account
    
    onProgress("Sending Create Buffer Transaction...");
    const signedInitTx = await wallet.signTransaction(initTx);
    const initSig = await connection.sendRawTransaction(signedInitTx.serialize());
    await connection.confirmTransaction(initSig);
    onProgress(`Buffer Created. Tx: ${initSig}`);

    // Loop for Writes
    // Instruction 1: Write
    // Data: [1, offset(4 bytes), bytes...]
    
    onProgress(`Uploading ${chunks} chunks...`);
    
    let offset = 0;
    const transactions: Transaction[] = [];
    
    // Batching transactions to avoid spamming wallet popups too much? 
    // Ideally use signAllTransactions for batches.
    const BATCH_SIZE = 4; // Sign 4 chunks at a time
    
    for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, binary.length);
        const chunk = binary.slice(start, end);
        
        const offsetBuffer = Buffer.alloc(4);
        offsetBuffer.writeUInt32LE(offset, 0);
        
        const chunkLenBuffer = Buffer.alloc(8);
        chunkLenBuffer.writeBigUInt64LE(BigInt(chunk.length), 0);

        const writeDiscriminator = Buffer.alloc(4);
        writeDiscriminator.writeUInt32LE(1, 0); // Write = 1

        const writeData = Buffer.concat([
            writeDiscriminator,
            offsetBuffer,
            chunkLenBuffer,
            Buffer.from(chunk)
        ]);
        
        const writeIx = new TransactionInstruction({
            keys: [
                { pubkey: bufferKeypair.publicKey, isSigner: false, isWritable: true },
                { pubkey: wallet.publicKey, isSigner: true, isWritable: false }, // authority
            ],
            programId: BPF_LOADER_PROGRAM_ID,
            data: writeData
        });
        
        const tx = new Transaction().add(writeIx);
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.feePayer = wallet.publicKey;
        
        transactions.push(tx);
        offset += chunk.length;
    }
    
    // Send in batches
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
        const batch = transactions.slice(i, i + BATCH_SIZE);
        onProgress(`Signing batch ${i / BATCH_SIZE + 1}/${Math.ceil(transactions.length / BATCH_SIZE)}...`);
        
        // Re-fetch blockhash for later batches to avoid expiration
        const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        batch.forEach(tx => tx.recentBlockhash = recentBlockhash);
        
        const signedBatch = await wallet.signAllTransactions(batch);
        
        onProgress(`Sending batch ${i / BATCH_SIZE + 1}...`);
        for (const signedTx of signedBatch) {
            const sig = await connection.sendRawTransaction(signedTx.serialize());
            // Wait for confirmation? Doing it for every chunk is slow.
            // Maybe wait every few chunks or just fire and forget then check later?
            // For reliability let's wait confirm on the last one of the batch
            await connection.confirmTransaction(sig);
        }
    }
    
    onProgress("Upload complete. Finalizing deployment...");
    
    // Instruction 2: DeployWithMaxDataLen
    // Data: [2, max_data_len(8)]
    
    // Keys: 
    // 0. Payer
    // 1. ProgramData Account (derived) - check this? actually usually simpler
    // 2. Program Account
    // 3. Buffer Account
    // 4. Rent
    // 5. Clock
    // 6. System Program
    // 7. Authority
    
    // Actually the layout is:
    // keys: [payer, program_data, program, buffer, rent, clock, system, authority]
    
    const programData = PublicKey.findProgramAddressSync(
        [programKeypair.publicKey.toBuffer()],
        BPF_LOADER_PROGRAM_ID
    )[0];
    
    const maxDataLenBuffer = Buffer.alloc(8);
    maxDataLenBuffer.writeBigUInt64LE(BigInt(binary.length + 45), 0); 
    // Often we set it to something larger for realloc updates, usually 2x or similar.
    // For now use exact binary len.
    
    const deployDiscriminator = Buffer.alloc(4);
    deployDiscriminator.writeUInt32LE(2, 0); // DeployWithMaxDataLen = 2

    const deployData = Buffer.concat([
        deployDiscriminator,
        maxDataLenBuffer
    ]);
    
    const deployIx = new TransactionInstruction({
        keys: [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true }, // Payer
            { pubkey: programData, isSigner: false, isWritable: true },
            { pubkey: programKeypair.publicKey, isSigner: true, isWritable: true },
            { pubkey: bufferKeypair.publicKey, isSigner: false, isWritable: true },
            { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false },
            { pubkey: new PublicKey("SysvarC1ock11111111111111111111111111111111"), isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: false }, // Authority
        ],
        programId: BPF_LOADER_PROGRAM_ID,
        data: deployData
    });

    const deployTx = new Transaction().add(deployIx);
    deployTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    deployTx.feePayer = wallet.publicKey;
    deployTx.sign(programKeypair);
    
    onProgress("Sending Final Deploy Transaction...");
    const signedDeployTx = await wallet.signTransaction(deployTx);
    const deploySig = await connection.sendRawTransaction(signedDeployTx.serialize());
    await connection.confirmTransaction(deploySig);
    
    onProgress(`Deployed! Program ID: ${programKeypair.publicKey.toBase58()}`);
    return programKeypair.publicKey.toBase58();
};
