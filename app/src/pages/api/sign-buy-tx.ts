import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { Keypair, Transaction, VersionedMessage, VersionedTransaction } from '@solana/web3.js';
import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
    message?: string
    tx?: string
}

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {

    if (req.method != "POST") {
        return res.status(400).json({
            message: "Unsupported method"
        });
    }

    try {

        const authorityPrivkey = process.env.AUTHORITY_PRIVKEY ?? "";
        const authoritySigner = Keypair.fromSecretKey(bs58.decode(authorityPrivkey));

        const { serializedTx } = req.body;
        const tx = Transaction.from(bs58.decode(serializedTx));
        tx.partialSign(authoritySigner);
        const signedTx = bs58.encode(tx.serialize({
            requireAllSignatures: false
        }));

        res.status(200).json({ tx: signedTx })
    }
    catch (ex: any) {
        console.log(ex);
        res.status(500).json({ message: ex.toString() })
    }
}