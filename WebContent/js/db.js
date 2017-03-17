var DB = {};

DB.init = function() {
	if (window.confirm('are you sure to initialize database?')) {
		DB.load();
	}
};

DB.load = function() {
	alasql.options.joinstar = 'overwrite';

	// Classes
	alasql('DROP TABLE IF EXISTS kind;');
	alasql('CREATE TABLE kind(id INT IDENTITY, text STRING);');
	var pkind = alasql.promise('SELECT MATRIX * FROM CSV("data/KIND-KIND.csv", {headers: true})').then(function(kinds) {
		for (var i = 0; i < kinds.length; i++) {
			var kind = kinds[i];
			alasql('INSERT INTO kind VALUES(?,?);', kind);
		}
	});

	// Items
	alasql('DROP TABLE IF EXISTS item;');
	alasql('CREATE TABLE item(id INT IDENTITY, code STRING, kind INT, detail STRING, maker STRING, price INT, unit STRING, pclass STRING);');
	var pitem = alasql.promise('SELECT MATRIX * FROM CSV("data/ITEM-ITEM.csv", {headers: true})').then(function(items) {
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			alasql('INSERT INTO item VALUES(?,?,?,?,?,?,?,?);', item);
		}
	});

	// Warehouses
	alasql('DROP TABLE IF EXISTS whouse;');
	alasql('CREATE TABLE whouse(id INT IDENTITY, name STRING, addr STRING, tel STRING);');
	var pwhouse = alasql.promise('SELECT MATRIX * FROM CSV("data/WHOUSE-WHOUSE.csv", {headers: true})').then(
			function(whouses) {
				for (var i = 0; i < whouses.length; i++) {
					var whouse = whouses[i];
					alasql('INSERT INTO whouse VALUES(?,?,?,?);', whouse);
				}
			});

	// Inventories
	alasql('DROP TABLE IF EXISTS stock;');
	alasql('CREATE TABLE stock(id INT IDENTITY, item INT, whouse INT, balance INT, obsoleteperiod INT, maxusage INT, leadtime INT, avgdailyusage INT, maxleadtime INT, reorderstatus INT);');
	var pstock = alasql.promise('SELECT MATRIX * FROM CSV("data/STOCK-STOCK.csv", {headers: true})').then(
			function(stocks) {
				for (var i = 0; i < stocks.length; i++) {
					var stock = stocks[i];
					alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?,?,?,?);', stock);
				}
			});

	// Transaction
	alasql('DROP TABLE IF EXISTS trans;');
	alasql('CREATE TABLE trans(id INT IDENTITY, stock INT, date DATE, qty INT, balance INT, memo STRING);');
	var ptrans = alasql.promise('SELECT MATRIX * FROM CSV("data/TRANS-TRANS.csv", {headers: true})').then(
			function(transs) {
				for (var i = 0; i < transs.length; i++) {
					var trans = transs[i];
					alasql('INSERT INTO trans VALUES(?,?,?,?,?,?);', trans);
				}
			});


	alasql('DROP TABLE IF EXISTS forecast;');
    alasql('CREATE TABLE forecast(id INT IDENTITY, stockid INT, times DATE, type STRING, quantity INT);');

    var pforecast = alasql.promise('SELECT MATRIX * FROM CSV("data/FORECAST-FORECAST.csv", {headers: true})').then(
        function(forecasts) {
            for (var i = 0; i < forecasts.length; i++) {
                var forecast = forecasts[i];
                alasql('INSERT INTO forecast VALUES(?,?,?,?,?);', forecast);
            }
        });

    alasql('DROP TABLE IF EXISTS supplier;');
    alasql('CREATE TABLE supplier(id INT IDENTITY, whouseid INT, name STRING);');

    var psupplier = alasql.promise('SELECT MATRIX * FROM CSV("data/SUPPLIER-SUPPLIER.csv", {headers: true})').then(
        function(suppliers) {
            for (var i = 0; i < suppliers.length; i++) {
                var supplier = suppliers[i];
                alasql('INSERT INTO supplier VALUES(?,?,?);', supplier);
            }
        });


    alasql('DROP TABLE IF EXISTS supplierrating;');
    alasql('CREATE TABLE supplierrating(id INT IDENTITY, supplierid INT, rating INT);');

    var psupplierrating = alasql.promise('SELECT MATRIX * FROM CSV("data/SUPPLIERRATING-SUPPLIERRATING.csv", {headers: true})').then(
        function(supplierratings) {
            for (var i = 0; i < supplierratings.length; i++) {
                var supplierrating = supplierratings[i];
                alasql('INSERT INTO supplierrating VALUES(?,?,?);', supplierrating);
            }
        });


    alasql('DROP TABLE IF EXISTS reorderproduct;');
    alasql('CREATE TABLE reorderproduct(id INT IDENTITY, stockid INT, supplierid INT, status STRING, orderquantity INT,' +
		' orderplaceddate DATE, orderreceiveddate DATE, expectedreceivedate DATE, orderreceivequantity INT, ' +
		'receivequantitygood INT, receivequantitydamaged INT);');




    // Reload page
	Promise.all([ pkind, pitem, pwhouse, pstock, ptrans, pforecast, psupplier, psupplierrating ]).then(function() {
		window.location.reload(true);
	});
};

DB.remove = function() {
	if (window.confirm('are you sure to delete dababase?')) {
		alasql('DROP localStorage DATABASE STK')
	}
};

// add commas to number
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// DO NOT CHANGE!
alasql.promise = function(sql, params) {
	return new Promise(function(resolve, reject) {
		alasql(sql, params, function(data, err) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
};

// connect to database
try {
	alasql('ATTACH localStorage DATABASE STK;');
	alasql('USE STK;');
} catch (e) {
	alasql('CREATE localStorage DATABASE STK;');
	alasql('ATTACH localStorage DATABASE STK;');
	alasql('USE STK;');
	DB.load();
}
