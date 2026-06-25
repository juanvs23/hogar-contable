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
	export class CategoryTotal {
	    category_id: number;
	    category_name: string;
	    total_bs: number;
	    total_usd: number;
	    total_usdt: number;
	
	    static createFrom(source: any = {}) {
	        return new CategoryTotal(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.category_id = source["category_id"];
	        this.category_name = source["category_name"];
	        this.total_bs = source["total_bs"];
	        this.total_usd = source["total_usd"];
	        this.total_usdt = source["total_usdt"];
	    }
	}
	export class Saving {
	    id: number;
	    description: string;
	    amount_bs: number;
	    amount_usd: number;
	    created_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Saving(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.description = source["description"];
	        this.amount_bs = source["amount_bs"];
	        this.amount_usd = source["amount_usd"];
	        this.created_at = source["created_at"];
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
	
	export class ClosureResult {
	    month: string;
	    total_income_bs: number;
	    total_expenses_bs: number;
	    balance_bs: number;
	    total_income_usd: number;
	    total_expenses_usd: number;
	    balance_usd: number;
	    total_income_usdt: number;
	    total_expenses_usdt: number;
	    balance_usdt: number;
	    closed_at: string;
	
	    static createFrom(source: any = {}) {
	        return new ClosureResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.month = source["month"];
	        this.total_income_bs = source["total_income_bs"];
	        this.total_expenses_bs = source["total_expenses_bs"];
	        this.balance_bs = source["balance_bs"];
	        this.total_income_usd = source["total_income_usd"];
	        this.total_expenses_usd = source["total_expenses_usd"];
	        this.balance_usd = source["balance_usd"];
	        this.total_income_usdt = source["total_income_usdt"];
	        this.total_expenses_usdt = source["total_expenses_usdt"];
	        this.balance_usdt = source["balance_usdt"];
	        this.closed_at = source["closed_at"];
	    }
	}
	export class ImportResult {
	    imported: number;
	    errors?: string;
	
	    static createFrom(source: any = {}) {
	        return new ImportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.imported = source["imported"];
	        this.errors = source["errors"];
	    }
	}
	export class MonthlySummary {
	    month: string;
	    total_income_bs: number;
	    total_expenses_bs: number;
	    balance_bs: number;
	    total_income_usd: number;
	    total_expenses_usd: number;
	    balance_usd: number;
	    total_income_usdt: number;
	    total_expenses_usdt: number;
	    balance_usdt: number;
	
	    static createFrom(source: any = {}) {
	        return new MonthlySummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.month = source["month"];
	        this.total_income_bs = source["total_income_bs"];
	        this.total_expenses_bs = source["total_expenses_bs"];
	        this.balance_bs = source["balance_bs"];
	        this.total_income_usd = source["total_income_usd"];
	        this.total_expenses_usd = source["total_expenses_usd"];
	        this.balance_usd = source["balance_usd"];
	        this.total_income_usdt = source["total_income_usdt"];
	        this.total_expenses_usdt = source["total_expenses_usdt"];
	        this.balance_usdt = source["balance_usdt"];
	    }
	}
	export class SavingTotal {
	    total_bs: number;
	    total_usd: number;
	
	    static createFrom(source: any = {}) {
	        return new SavingTotal(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total_bs = source["total_bs"];
	        this.total_usd = source["total_usd"];
	    }
	}

}

