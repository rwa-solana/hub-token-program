"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyEntity = void 0;
class PropertyEntity {
    mint;
    authority;
    name;
    symbol;
    totalSupply;
    circulatingSupply;
    decimals;
    details;
    status;
    currentEpoch;
    createdAt;
    constructor(data) {
        this.mint = data.mint;
        this.authority = data.authority;
        this.name = data.name;
        this.symbol = data.symbol;
        this.totalSupply = data.totalSupply;
        this.circulatingSupply = data.circulatingSupply;
        this.decimals = data.decimals;
        this.details = data.details;
        this.status = data.status;
        this.currentEpoch = data.currentEpoch;
        this.createdAt = data.createdAt;
    }
    get availableSupply() {
        return this.totalSupply - this.circulatingSupply;
    }
    get valuePerToken() {
        if (this.totalSupply === 0n)
            return 0;
        return this.details.totalValueUsd / Number(this.totalSupply);
    }
    canMint(amount) {
        return this.status === 'active' && this.circulatingSupply + amount <= this.totalSupply;
    }
    static fromOnChain(data, mint) {
        return new PropertyEntity({
            mint,
            authority: data.authority?.toString() || '',
            name: data.propertyName || data.name || 'Unknown Property',
            symbol: data.propertySymbol || data.symbol || 'UNK',
            totalSupply: BigInt(data.totalSupply?.toString() || '0'),
            circulatingSupply: BigInt(data.circulatingSupply?.toString() || '0'),
            decimals: data.decimals || 9,
            details: {
                propertyType: data.details?.propertyType || 'residential',
                location: data.details?.propertyAddress || data.details?.location || 'Unknown',
                totalValueUsd: Number(data.details?.totalValueUsd?.toString() || '0'),
                annualYieldPercent: (data.details?.rentalYieldBps || 0) / 100,
                metadataUri: data.details?.metadataUri || '',
            },
            status: data.isActive ? 'active' : 'paused',
            currentEpoch: Number(data.currentEpoch?.toString() || '0'),
            createdAt: data.createdAt
                ? new Date(Number(data.createdAt.toString()) * 1000)
                : new Date(),
        });
    }
}
exports.PropertyEntity = PropertyEntity;
//# sourceMappingURL=Property.js.map