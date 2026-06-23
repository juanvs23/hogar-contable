export namespace core {
	
	export class Category {
	    id: number;
	    name: string;
	    type: string;
	    is_default: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Category(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.is_default = source["is_default"];
	    }
	}
	export class Transaction {
	    id: number;
	    type: string;
	    description: string;
	    amount_bs: number;
	    amount_usd_bcv: number;
	    amount_usdt: number;
	    rate_official: number;
	    rate_p2p: number;
	    category_id?: number;
	    date: string;
	    created_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Transaction(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.description = source["description"];
	        this.amount_bs = source["amount_bs"];
	        this.amount_usd_bcv = source["amount_usd_bcv"];
	        this.amount_usdt = source["amount_usdt"];
	        this.rate_official = source["rate_official"];
	        this.rate_p2p = source["rate_p2p"];
	        this.category_id = source["category_id"];
	        this.date = source["date"];
	        this.created_at = source["created_at"];
	    }
	}

}

export namespace main {
	
	export class ExchangeRateResult {
	    official: number;
	    p2p: number;
	
	    static createFrom(source: any = {}) {
	        return new ExchangeRateResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.official = source["official"];
	        this.p2p = source["p2p"];
	    }
	}

}

export namespace service {
	
	export class MonthlySummary {
	    month: string;
	    total_income: number;
	    total_expenses: number;
	    balance: number;
	
	    static createFrom(source: any = {}) {
	        return new MonthlySummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.month = source["month"];
	        this.total_income = source["total_income"];
	        this.total_expenses = source["total_expenses"];
	        this.balance = source["balance"];
	    }
	}

}

