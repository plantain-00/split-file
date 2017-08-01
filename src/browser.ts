import { BinaryDecoder, BinaryEncoder } from "fluent-binary-converter/browser";

declare class TextEncoder {
    encode(text: string): Uint8Array;
}

declare class TextDecoder {
    decode(uint8Array: Uint8Array): string;
}

export default class SplitFile {
    private textEncoder = new TextEncoder();
    private textDecoder = new TextDecoder();
    decodeBlock(block: Uint8Array) {
        const binaryDecoder = new BinaryDecoder(block.buffer as ArrayBuffer, block.byteOffset);
        const totalBytesCount = binaryDecoder.getUint32();
        const fileNameBinaryLength = binaryDecoder.getUint32();
        const fileName = this.decode(binaryDecoder.getBinary(fileNameBinaryLength));
        const totalBlockCount = binaryDecoder.getUint32();
        const currentBlockIndex = binaryDecoder.getUint32();
        const binary = binaryDecoder.getBinary();
        return {
            totalBytesCount,
            fileName,
            totalBlockCount,
            currentBlockIndex,
            binary,
        };
    }
    split(uint8Array: Uint8Array, fileName: string, size: number = 10000) {
        const blocks: Uint8Array[] = [];
        if (uint8Array.length === 0) {
            return blocks;
        }
        const totalBlockCount = Math.floor((uint8Array.length - 1) / size) + 1;
        const totalBlockCountBinary = BinaryEncoder.fromUint32(totalBlockCount);

        const totalBytesCountBinary = BinaryEncoder.fromUint32(uint8Array.length);

        const fileNameBinary = this.encode(fileName);
        const fileNameBinaryLengthBinary = BinaryEncoder.fromUint32(fileNameBinary.length);

        for (let i = 0; i < totalBlockCount; i++) {
            const binary = uint8Array.subarray(i * size, i * size + size);
            const currentBlockIndexBinary = BinaryEncoder.fromUint32(i);
            const block = new Uint8Array(totalBytesCountBinary.length
                + fileNameBinaryLengthBinary.length
                + fileNameBinary.length
                + totalBlockCountBinary.length
                + currentBlockIndexBinary.length
                + binary.length);
            const binaryEncoder = new BinaryEncoder(block);
            binaryEncoder.setBinary(totalBytesCountBinary,
                fileNameBinaryLengthBinary,
                fileNameBinary,
                totalBlockCountBinary,
                currentBlockIndexBinary,
                binary);
            blocks.push(block);
        }
        return blocks;
    }

    protected encode(text: string) {
        return this.textEncoder.encode(text);
    }
    protected decode(uint8Array: Uint8Array) {
        return this.textDecoder.decode(uint8Array);
    }
}