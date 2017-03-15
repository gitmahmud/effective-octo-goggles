/**
 * Created by rahman_ma-pc on 3/14/2017.
 */

var allProducts = alasql('SELECT item.id AS itemId , stock.id, whouse.name, kind.text, item.code, item.maker, item.detail, item.price, stock.balance, item.unit \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 ');


for(let i = 0 ; i<allProducts.length ; i++)
{
    let currentProduct = allProducts[i];
    let str = '<tr><td><div style="float: left">';
    str+='Name : '+currentProduct.code +'<br>';
    str+='Detail : '+currentProduct.detail +'<br>';
    str+='Maker : '+currentProduct.maker +'<br>';
    str+='Classification : '+currentProduct.text +'<br>';
    str+='Price : '+currentProduct.price+'<br>';
    str+= '<form class="form-inline"><div class="form-group">';
    str+= 'Quantity : ' + '<input style="width: 80px" class="form-control quantity_stock_id_'+ currentProduct.id+'" value="1" type="number" ></div></form></div>';
    str+= ' <div style="float: right"><img src="img/'+currentProduct.itemId+'.jpg"></div>';

    str += '<div class="clearfix"></div>';

    str+='<button  class="btn btn-primary" id="order_button_stock_id_'+ currentProduct.id +'" style="margin-left: 40%">Order</button></td></tr>'

    $('#customer_tbody').append(str);


}



$("button[id^='order_button_stock_id_']").on('click' , function () {
    let arr = $(this).attr('id').split('_');
    let stockId = parseInt(arr[arr.length - 1]);

    let quantity = $('.quantity_stock_id_'+stockId).val();

    alert(quantity);




})


