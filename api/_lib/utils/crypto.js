import sodium from 'libsodium-wrappers';


const getCrypto = async () => {
    await sodium.ready;
    return sodium;
};

export const encryptSecret = async (message, key) => {
    const s = await getCrypto();
    
    // Generamos Nonce de 24 bytes (Específico de XChaCha20)
    const nonce = s.randombytes_buf(s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

    const ciphertext = s.crypto_aead_xchacha20poly1305_ietf_encrypt(
        message,
        null,
        null,
        nonce,
        key
    );

    return {
        ciphertext: s.to_hex(ciphertext),
        nonce: s.to_hex(nonce)
    };
};

export const decryptSecret = async (ciphertextHex, nonceHex, key) => {
    const s = await getCrypto();
    const ciphertext = s.from_hex(ciphertextHex);
    const nonce = s.from_hex(nonceHex);

    try {
        const decrypted = s.crypto_aead_xchacha20poly1305_ietf_decrypt(
            null,
            ciphertext,
            null,
            nonce,
            key
        );
        return s.to_string(decrypted);
    } catch (e) {
        throw new Error("Fallo de integridad: Clave incorrecta o datos manipulados.");
    }
};