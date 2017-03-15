/**
 * Created by rahman_ma-pc on 3/15/2017.
 */
// var reorderParam = $.url().param('q');


var newReorders =  alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, stock.balance, item.pclass \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 and stock.reorderstatus = 1' );

displayNewReorders();

$("#id_new_reorder_list_stock_quantity_desc").on('click', function () {

    newReorders.sort(function (a, b) {
        let cmp = - a.balance + b.balance
        return cmp === 0 ? a.pclass.localeCompare(b.pclass) : cmp ;
    });

    displayNewReorders();

});

$("#id_new_reorder_list_stock_quantity_asc").on('click', function () {

    newReorders.sort(function (a, b) {
        let cmp =  a.balance - b.balance
        return cmp === 0 ? a.pclass.localeCompare(b.pclass) : cmp ;
    });

    displayNewReorders();

});

$("#id_new_reorder_list_pclass_desc").on('click', function () {

    newReorders.sort(function (a, b) {
        let cmp = a.pclass.localeCompare(b.pclass);
        return cmp === 0 ? -a.balance + b.balance : cmp ;
    });

    displayNewReorders();

});

$("#id_new_reorder_list_pclass_asc").on('click', function () {

    newReorders.sort(function (a, b) {
        let cmp = b.pclass.localeCompare(a.pclass);
        return cmp === 0 ? -a.balance + b.balance : cmp ;
    });

    displayNewReorders();

});







function displayNewReorders() {

    let str = '';

    for(let i = 0;i<newReorders.length;i++)
    {

        let currentProduct  = newReorders[i];

        str += '<tr>';
        str += '<td>'+currentProduct.code+'</td>';
        str += '<td>'+currentProduct.maker+'</td>';
        str += '<td>'+currentProduct.detail+'</td>';
        str += '<td>'+currentProduct.balance+'</td>';
        str += '<td>'+currentProduct.pclass+'</td>';
        str += '<td><a href="reorder-form.html?id='+currentProduct.id+'"><button class="btn btn-primary">Reorder</button></a></td></tr>'

    }

    $('#tbody_new_reorder').html(str);


}


