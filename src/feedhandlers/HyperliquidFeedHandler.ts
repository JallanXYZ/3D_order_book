import { OrderBookAction, Side } from '../L2Book'
import { FeedHandler, OrderBookEvent, TradeEvent } from './Feedhandler'

export default class HyperliquidFeedHandler extends FeedHandler {

    constructor() {
        super('Hyperliquid', 'wss://api.hyperliquid.xyz/ws')
    }

    onOpen(event: Event): void {
        this.ws().send(JSON.stringify({
            method: 'subscribe',
            subscription: { type: 'l2Book', coin: this.getSymbol() }
        }))
        this.ws().send(JSON.stringify({
            method: 'subscribe',
            subscription: { type: 'trades', coin: this.getSymbol() }
        }))
    }

    onMessage(event: MessageEvent): void {
        const msg = JSON.parse(event.data as string)
        if (msg.channel === 'l2Book') {
            this.handleOrderBookEvent(msg.data)
        }
        if (msg.channel === 'trades') {
            this.handleTradeEvent(msg.data)
        }
    }

    handleOrderBookEvent(data: any) {
        const [bidsRaw, asksRaw] = data.levels
        const obEvent: OrderBookEvent = {
            action: OrderBookAction.Partial,
            bids: bidsRaw.map((x: any) => [Number.parseFloat(x.px), Number.parseFloat(x.sz)]),
            asks: asksRaw.map((x: any) => [Number.parseFloat(x.px), Number.parseFloat(x.sz)])
        }
        this.publishOrderBookEvent(obEvent)
    }

    handleTradeEvent(data: any[]) {
        data.forEach(t => {
            const trade: TradeEvent = {
                price: Number.parseFloat(t.px),
                size: Number.parseFloat(t.sz),
                side: t.side === 'B' ? Side.Buy : Side.Sell
            }
            this.publishTradeEvent(trade)
        })
    }
}
