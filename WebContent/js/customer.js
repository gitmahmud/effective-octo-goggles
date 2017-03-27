/**
 * Created by rahman_ma-pc on 3/14/2017.
 */

var allProducts = alasql('SELECT item.id AS itemId , stock.id, whouse.name, kind.text, item.code, item.maker, item.detail, item.price, stock.balance, item.unit \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 ');

var discountProducts = alasql('SELECT * from promotionmaster where enddate = "" and type = "discount"');

discountProducts.forEach(function (discountProduct, index) {
    let p = allProducts.find(function (allProduct, index) {
        return discountProduct.obsoletestockid === allProduct.id;
    });

    p["discount"] = true;
    p["discountamount"] = alasql("Select * from promotiondiscount where pmid = ?",
        [discountProduct.id])[0]["discountamount"];

    p["discountedprice"] = p["price"] - p["discountamount"];



});


var bundleProducts = alasql('SELECT * from promotionmaster where enddate = "" and type = "bundle"');



bundleProducts.forEach(function (bundleProduct) {
    bundleProduct = alasql('SELECT * from promotionbundle where pmid = ?',[bundleProduct.id])[0];
    let bundleItems = alasql('SELECT * from bundleitems where pbid = ?',[bundleProduct.id]);

    // let bundle =

    let str = '<tr><td>';
    str += 'Bundle name : '+bundleProduct.name+'<br>';
    str += 'Bundle details : '+bundleProduct.details+'<br>';
    str +='<table class="table table-bordered"><tbody><tr><th>Product Name</th>'

    bundleItems.forEach(function (bundleItem, index) {
        let p  = allProducts.find(function (product) {
            return bundleItem.stockid === product.id;
        });

        str+= '<td>'+ p["code"]+'</td>';

    });

    str+='</tr><tr> <th>Product Quantity </th>';


    bundleItems.forEach(function (bundleItem, index) {


        str+= '<td>'+ bundleItem.quantity+'</td>';

    });


    str +='</tr></tbody>';


    str+='</table>';




    str += 'Bundle Price : '+bundleProduct.bundleprice+'<br>';
    str += 'Discount amount : '+bundleProduct.discount+'<br>';

    str += '<form class="form-inline" style="margin-top: 20px;"><div class="form-group">Quantity : ' +
        '<input style="width: 80px" class="form-control quantity_bundle_id_'
        + bundleProduct.id + '" value="1" type="number" ></div></form></div>';

    str += '<button  class="btn btn-success" id="order_button_bundle_id_' + bundleProduct.id + '" style="margin-left: 40%">Order</button></td></tr>'

    str += '<td></tr>';



    $('#tbody_customer_bundle').append(str);







});

var freeProducts = alasql('SELECT * from promotionmaster where enddate = "" and type = "free"');


freeProducts.forEach(function (item,index) {

    let freeDetails = alasql("SELECT * from promotionfree where pmid = ?",[item.id])[0];

    let originalProduct = allProducts.find(function (product, index) {

        return product.id === freeDetails.originalstockid;
    });
    let freeProduct = allProducts.find(function (product, index) {
        return product.id === item.obsoletestockid;
    });


    let str = '<tr><td>';
    str += '<b>Product name </b> : '+ originalProduct.code+'<br>';
    str += '<b>Product detail </b> : '+originalProduct.detail +'<br><br>';
    str += '<span style="margin-top: 50px;"><b>Free : </b>  <label class="label label-info " style="font-size: large;">'+ freeProduct.code +'</label></span><br>';

    str += '<form class="form-inline" style="margin-top: 20px;"><div class="form-group">';
    str += 'Quantity : ' + '<input style="width: 80px" class="form-control quantity_free_id_' + freeDetails.id + '" value="1" type="number" ></div></form></div>';

    str += '<button  class="btn btn-success" id="order_button_free_id_' + freeDetails.id + '" style="margin-left: 40%">Order</button></td></tr>'

    str +='</td></tr>';

    $('#tbody_customer_bundle').append(str);



});

if(bundleProducts.length >0 || freeProducts.length >0)
{
    $('#offerProducts').show();
}



for (let i = 0; i < allProducts.length; i++) {
    let currentProduct = allProducts[i];
    let str = '<tr><td><div style="float: left">';
    str += 'Name : ' + currentProduct.code + '<br>';
    str += 'Detail : ' + currentProduct.detail + '<br>';
    str += 'Maker : ' + currentProduct.maker + '<br>';
    str += 'Classification : ' + currentProduct.text + '<br>';
    str += 'Price : ' + currentProduct.price + '<br>';
    if (currentProduct["discount"])
    {
        str += 'Discount : '+currentProduct["discountamount"]+'<br>';
        str += 'Discounted price : <label class="label label-success" style="font-size: large;margin-bottom: 20px">'+ currentProduct["discountedprice"]+ '</label><br>';


    }

        str += '<form class="form-inline" style="margin-top: 20px;"><div class="form-group">';
    str += 'Quantity : ' + '<input style="width: 80px" class="form-control quantity_stock_id_' + currentProduct.id + '" value="1" type="number" ></div></form></div>';
    str += ' <div style="float: right"><img src="img/' + currentProduct.itemId + '.jpg"></div>';

    str += '<div class="clearfix"></div>';

    str += '<button  class="btn btn-primary" id="order_button_stock_id_' + currentProduct.id + '" style="margin-left: 40%">Order</button></td></tr>'

    $('#customer_tbody').append(str);


}


$("button[id^='order_button_stock_id_']").on('click', function () {
    let arr = $(this).attr('id').split('_');
    let stockId = parseInt(arr[arr.length - 1]);

    let quantity = $('.quantity_stock_id_' + stockId).val();

    let orderId = alasql('SELECT max(id)+1 AS max_id from customerorder')[0]["max_id"];
    orderId = orderId === undefined ? 1 : orderId;


    orderId = orderId === undefined ? 1 : orderId;

    let stockProduct = allProducts.find(function (p, index) {
        return  p.id === stockId;
    });
    if(stockProduct.balance < quantity)
    {
        let confirmBackorder = confirm("There is not enough inventory to fullfill your order . Do you want to place backorder ? ");

        if(confirmBackorder)
        {
            alasql('INSERT INTO customerorder VALUES(?,?,?,?,?)',[orderId , 'stock' , quantity , stockId , 1]);
            alert("Your backorder has been taken. Backorder ID : #"+orderId);


        }

    }
    else
    {
        alasql('INSERT INTO customerorder VALUES(?,?,?,?,?)',[orderId , 'stock' , quantity , stockId ,0 ]);
        alert("Your order has been taken. Order ID : #"+orderId);

    }


    window.location.reload(true);








});

$("button[id^='order_button_free_id_']").on('click', function () {
    let arr = $(this).attr('id').split('_');
    let freeId = parseInt(arr[arr.length - 1]);

    let quantity = $('.quantity_free_id_' + freeId).val();

    let orderId = alasql('SELECT max(id)+1 AS max_id from customerorder')[0]["max_id"];
    orderId = orderId === undefined ?1 : orderId;


    let t = alasql('SELECT * from promotionfree where id = ?',[freeId])[0];

    let originalProductQuantity = allProducts.find(function (product, index) {
        return t.originalstockid === product.id;
    })["balance"];

    console.log(t);
    let tempId = alasql('SELECT * from promotionmaster where id = ? ',[t["pmid"]])[0]["obsoletestockid"];


    let freeProductQuantity = allProducts.find(function (product,index) {
        return tempId === product.id ;

    })["balance"];

    if(originalProductQuantity < quantity || freeProductQuantity < quantity)
    {
        let confirmBackorder = confirm("There is not enough inventory to fullfill your order . Do you want to place backorder ? ");

        if(confirmBackorder)
        {
            alasql('INSERT INTO customerorder VALUES(?,?,?,?,?)',[orderId , 'free' , quantity , freeId , 1]);
            alert("Your backorder has been taken. Backorder ID : #"+orderId);

        }

    }
    else {

        alasql('INSERT INTO customerorder VALUES(?,?,?,?,?)',[orderId , 'free' , quantity , freeId , 0]);

        alert("Your order has been taken. Order ID : #"+orderId);

    }


    window.location.reload(true);








});


$("button[id^='order_button_bundle_id_']").on('click', function () {
    let arr = $(this).attr('id').split('_');
    let bundleId = parseInt(arr[arr.length - 1]);

    let quantity = $('.quantity_bundle_id_' + bundleId).val();

    let orderId = alasql('SELECT max(id)+1 AS max_id from customerorder')[0]["max_id"];
    orderId = orderId === undefined ?1 : orderId;

    let bundleItems = alasql('SELECT * from bundleitems where pbid = ? ',[ bundleId ]);

    let flag = false;
    for(let i = 0 ; i < bundleItems.length ; i++)
    {
        let pBalance = allProducts.find(function (product , index) {
            return product.id === bundleItems[i]["stockid"];
        }).balance;

        if(pBalance < quantity)
        {
            flag = true;
            break;
        }

    }



    if(flag)
    {
        let confirmBackorder = confirm("There is not enough inventory to fullfill your order . Do you want to place backorder ? ");

        if(confirmBackorder)
        {
            alasql('INSERT INTO customerorder VALUES(?,?,?,?,?)',[orderId , 'bundle' , quantity , bundleId , 1]);
            alert("Your backorder has been taken. Backorder ID : #"+orderId);
        }

    }
    else {


        alasql('INSERT INTO customerorder VALUES(?,?,?,?,?)',[orderId , 'bundle' , quantity , bundleId, 0]);

        alert("Your order has been taken. Order ID : #"+orderId);

    }

    window.location.reload(true);






});






