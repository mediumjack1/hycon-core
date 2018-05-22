import { getLogger } from "log4js"
import { NewTx } from "../serialization/proto"
import { Server } from "../server"
import { Hash } from "../util/hash"
import { ITxPool } from "./itxPool"
import { SignedTx } from "./txSigned"
// tslint:disable-next-line:no-var-requires
const assert = require("assert")
const logger = getLogger("AppTxPool")
interface ITxCallback {
    callback: (txs: SignedTx[]) => void,
    n: number
}
export class TxPool implements ITxPool {
    private server: Server
    private txs: SignedTx[]
    private txMap: Map<string, SignedTx>
    private callbacks: ITxCallback[]
    private minFee: number

    constructor(server: Server, minFee?: number) {
        this.server = server
        this.txs = []
        this.callbacks = []
        this.minFee = minFee === undefined ? 0 : minFee
        this.txMap = new Map<string, SignedTx>()
    }

    public putTxs(newTxsOriginal: SignedTx[]): number {
        const newTxs: SignedTx[] = []

        // drop it, if we already has it
        for (const oneTx of newTxsOriginal) {
            const key = new Hash(oneTx).toString()
            if (this.txMap.has(key)) {
                continue
            } else {
                newTxs.push(oneTx)
            }
        }
        // nothing to do
        if (newTxs.length <= 0) {
            return 0
        }

        // insert
        const { count, lowestIndex } = this.insert(newTxs)
        for (const oneTx of newTxs) {
            const key = new Hash(oneTx).toString()
            this.txMap.set(key, oneTx)
        }

        // check same size
        if (this.txMap.size !== this.txs.length) {
            logger.fatal("TX Pool error, resetting TX Pool")
            this.txs = Array.from(this.txMap.values())
        }

        // notify
        this.callback(lowestIndex)
        return count
    }

    public updateTxs(old: SignedTx[], maxReturn?: number): SignedTx[] {
        this.remove(old.slice(0, old.length))
        return this.txs.slice(0, maxReturn)
    }

    public onTopTxChanges(n: number, callback: (txs: SignedTx[]) => void): void {
        this.callbacks.push({ callback, n })
    }

    public getPending(): SignedTx[] {
        return this.txs
    }

    private insert(newTxs: SignedTx[]): { count: number, lowestIndex?: number } {
        newTxs.sort((a, b) => b.fee.compare(a.fee))
        let lowestIndex
        let count = 0
        let i = 0
        let j = 0
        let k = 0
        while (i < newTxs.length) {
            if (newTxs[i].fee.lessThan(this.minFee)) {
                return { count, lowestIndex }
            }

            if (j + k >= this.txs.length || newTxs[i].fee.greaterThan(this.txs[j + k].fee)) {
                this.txs.splice(j + k, 0, newTxs[i])
                if (count === 0) {
                    lowestIndex = j + k
                }
                count++
                k = 0
                i++
            } else if (newTxs[i].fee.lessThan(this.txs[j].fee)) {
                j++
            } else if (newTxs[i].fee.equals(this.txs[j + k].fee)) {
                if (this.txs[j + k].equals(newTxs[i])) {
                    i++
                    k = 0
                } else {
                    k++
                }
            } else {
                logger.error(`TxPool insert error, it seems the data is not sorted correctly, skipping Tx and attempting to continue.`)
                i++
            }
        }
        return { count, lowestIndex }
    }

    private remove(txsOriginal: SignedTx[]) {
        const txs: SignedTx[] = []

        // proceed only if we has it!
        for (const oneTx of txsOriginal) {
            const key = new Hash(oneTx).toString()
            if (this.txMap.has(key)) {
                txs.push(oneTx)
            }
        }

        // nothing to process
        if (txs.length <= 0) {
            return
        }

        txs.sort((a, b) => b.fee.compare(a.fee))
        let i = 0
        let j = 0
        let k = 0
        while (i < txs.length && j < this.txs.length) {
            if (txs[i].fee.lessThan(this.txs[j].fee)) {
                j++
            } else if (j + k >= this.txs.length || txs[i].fee.greaterThan(this.txs[j + k].fee)) {
                i++
                k = 0
            } else {
                if (txs[i].fee.equals(this.txs[j + k].fee)) {
                    if (this.txs[j + k].equals(txs[i])) {
                        this.txs.splice(j + k, 1)
                    } else {
                        k++
                    }
                } else {
                    logger.error(`TxPool remove error, it seems the data is not sorted correctly, skipping Tx and attempting to continue.`)
                }
            }
        }

        // remove from map
        for (const oneTx of txs) {
            const key = new Hash(oneTx).toString()
            const deleteResult = this.txMap.delete(key)
            if (!deleteResult) {
                logger.fatal("TX Pool error In Deleting, resetting TX Pool")
            }
        }

        // the size should be always the same
        if (this.txMap.size !== this.txs.length) {
            logger.fatal("TX Pool error In Removing, resetting TX Pool")
            this.txs = Array.from(this.txMap.values())
        }

    }

    private callback(lowestIndex: number): void {
        const n = lowestIndex + 1
        for (const callback of this.callbacks) {
            if (callback.n >= n) {
                setImmediate(callback.callback, this.txs.slice(0, callback.n))
            }
        }
    }

}
