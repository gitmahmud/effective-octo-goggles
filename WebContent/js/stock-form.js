// options: warehouses and items
var today = localStorage.getItem('today');

var rows = alasql('SELECT * FROM whouse;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row.id);
	option.text(row.name);
	$('select[name="whouse"]').append(option);
}

var rows = alasql('SELECT * from item FULL OUTER JOIN stock ON item.id = stock.item where stock.whouse != 1');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row.id);
	option.text('[' + row.code + '] ' + row.detail);
	$('select[name="item"]').append(option);
}

$('input[name="date"]').val(today)




// update database
$('#update').on('click', function() {
	var whouse = parseInt($('select[name="whouse"]').val()) || 1;
	var item = parseInt($('select[name="item"]').val());
	var date = $('input[name="date"]').val();
	var qty = parseInt($('input[name="qty"]').val());
	var obsoleteperiod = parseInt($('input[name="obsoleteperiod"]').val());
	var memo = $('textarea[name="memo"]').val();

	// update stock record
	let stockId = alasql("SELECT max(id)+1 AS max_id from stock ")[0]['max_id'];

	console.log(stockId , item,1,0,obsoleteperiod , Math.floor((Math.random() * 70) + 30) , Math.floor((Math.random() * 5) + 3) ,
        Math.floor((Math.random() * 19) + 5) ,Math.floor((Math.random() * 5) + 4) , 0 , 0 );

	alasql("INSERT INTO stock (id,item,whouse , balance , obsoleteperiod,maxusage,leadtime, avgdailyusage,maxleadtime,reorderstatus,isobsolete) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
		[ stockId , item,1,qty,obsoleteperiod , Math.floor((Math.random() * 70) + 30) , Math.floor((Math.random() * 5) + 3) ,
            Math.floor((Math.random() * 19) + 5) ,Math.floor((Math.random() * 5) + 4) , 0 , 0 ]);

	// add trans record
	var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
	alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)', [ trans_id, stockId, date, qty, qty, memo ]);

	// reload page
	window.location.assign('stock.html?id=' + stockId);
});
