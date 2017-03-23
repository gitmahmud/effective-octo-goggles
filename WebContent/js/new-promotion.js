/**
 * Created by rahman_ma-pc on 3/21/2017.
 */
let stockId = parseInt($.url().param('id'));
console.log(stockId);


var stock = alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, \
    stock.maxusage, stock.leadtime , stock.avgdailyusage , stock.maxleadtime, stock.balance, item.pclass \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 and stock.id = ?', [stockId])[0];

var regularProducts = alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, \
    stock.balance, item.pclass, stock.obsoleteperiod \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 and stock.isobsolete = 0');


regularProducts.forEach(function (item, index) {
    item["sold_quantity"] = Math.abs(alasql('SELECT sum(qty) AS sold_quant from trans where stock = ?  and memo = "Sold"',
        [item.id])[0]["sold_quant"]);
});

var bundleProducts = [{
    'stockId': stock.id,
    'price': stock.price,
    'quantity': 1,
    'code': stock.code,
    'text': stock.text

}];

var bundleTypeItems = [];
var bundleTypeBoolean = false;


$('#new_promotion_stock_id').text(stock.id);
$('#new_promotion_name').text(stock.code);
$('#new_promotion_maker').text(stock.maker);
$('#new_promotion_detail').text(stock.detail);
$('#new_promotion_pclass').text(stock.pclass);
$('#discount_original_product_price').text(stock.price);
$('#discount_product_quantity').text(stock.balance);
$('#promotion_selection').change(onPromotionSelection);


function onPromotionSelection() {

    fetchRegularProducts();

    if ($(this).val() === 'discount') {
        $('#promotion_discount').show();
        $('#promotion_bundle').hide();
        $('#promotion_free').hide();

        $('input[name="discount_type"]').unbind('click');
        $('#discount_price_input').unbind('keyup');
        $('#discount_percentage_input').unbind('keyup');

        $('input[name="discount_type"]').change(onDiscountTypeChanged);
        $('#discount_price_input').keyup(onDiscountPriceInput);
        $('#discount_percentage_input').keyup(onDiscountPercentageInput);


    }

    else if ($(this).val() === 'bundle') {
        $('#promotion_discount').hide();
        $('#promotion_bundle').show();
        $('#promotion_free').hide();

        let availableBundleOffers = alasql('SELECT typename from bundletype where kindtext=?', [stock.text]);

        let availableBundleSelection = '<option value="0">Custom</option>';
        availableBundleOffers.forEach(function (offer, index) {
            availableBundleSelection += '<option value="' + offer.typename + '">' + offer.typename + '</option>';
        });

        $('#bundle_type_selection').html(availableBundleSelection);
        $('#bundleOfferDesc').html('You can choose freely any product in custom bundle offer . ');

        $('#bundle_type_selection').unbind('change');

        $('#bundle_type_selection').change(onBundleTypeChanged);


        displaySelectedBundleItems();


    }
    else if ($(this).val() === 'freeoffer') {
        $('#promotion_discount').hide();
        $('#promotion_bundle').hide();
        $('#promotion_free').show();
        $('#freeProductSuggestionSelection').unbind('change');
        $('#freeProductSuggestionSelection').change(onProductSuggestionChanged);

        displayFreeSuggestionTable();


    }
    else {
        $('#promotion_discount').hide();
        $('#promotion_bundle').hide();
        $('#promotion_free').hide();

    }


}


/* Discount functions */

function onDiscountTypeChanged() {

    if ($(this).val() === 'type_price') {

        $('#discount_percentage_form').hide();
        $('#discount_price_input').removeAttr('disabled');


    }
    else {
        $('#discount_percentage_form').show();
        $('#discount_price_input').attr('disabled', 'disabled');
    }

}

function onDiscountPriceInput() {
    let discountAmount = parseInt($('#discount_price_input').val());
    let discountedPrice = stock.price - discountAmount;
    $('#discounted_price').text(discountedPrice);
    $('#discount_total_loss').text(discountAmount * stock.balance);
    plotSaleForecastChart();


}
function onDiscountPercentageInput() {
    let percentValue = parseInt($('#discount_percentage_input').val());
    let percentPrice = Math.round((percentValue * stock.price ) / 100);
    console.log(percentPrice);
    $('#discount_price_input').val(percentPrice);
    onDiscountPriceInput();
}


/* Bundle functions */

function displaySelectedBundleItems() {


    let str = '';
    bundleProducts.forEach(function (bundleProduct, index) {
        str += '<tr class=""><td>' + (index + 1) + '</td>' +
            '<td>' + bundleProduct.code + '</td>' +
            '<td>' + bundleProduct.text + '</td>' +
            '<td><input type="number" value="' + bundleProduct.quantity + '" style="width: 50px;" id="bundle_input_quantity_' + bundleProduct.stockId + '" ></td>' +
            '<td id="bundle_table_product_price_' + bundleProduct.stockId + '">' + bundleProduct.quantity * bundleProduct.price + '</td>' +
            '<td></td></tr>';

    });


    $('#tbody_bundle_items').html(str);
    setTotalPriceBundle();

    $("input[id^='bundle_input_quantity_']").unbind('keyup');
    $("input[id^='bundle_input_quantity_']").keyup(onChangeBundleQuantity);

    $('#discount_amount_bundle_input').unbind('keyup');
    $('#discount_amount_bundle_input').keyup(onChangeDiscountAmount);

    if (bundleTypeBoolean === true) {
        $("input[id^='bundle_input_quantity_']").attr('disabled', true);
    }
    else {
        $("input[id^='bundle_input_quantity_']").attr('disabled', false);
    }


}
function displayModalChooseBundleProduct() {

    let classificationSelection = '<option value="0">All</option>';
    alasql('SELECT * FROM kind;').forEach(function (item, index) {
        classificationSelection += '<option value="' + item.text + '">' + item.text + '</option>';

    });

    $('#bundle_product_classification_selection').html(classificationSelection);


    let str = '';
    regularProducts.forEach(function (item, index) {
        if (bundleTypeBoolean === true && bundleTypeItems[0].kindtext !== item.text) {
            return;
        }
        str += '<tr>' +
            '<td><input name="modalBundleProductSelectionInput" type="radio" value="' + index + '"></td>' +
            '<td>' + item.code + '</td>' +
            '<td>' + item.text + '</td>' +
            '<td>' + item.price + '</td>' +
            '<td>' + item.sold_quantity + '</td>' +
            '<td>' + item.balance + '</td>' +
            '</tr>';

    });

    $('#tbody_modal_choose_bundle_product').html(str);


    initialiseAddAnotherItemsModalListeners();

    if (bundleTypeBoolean === true) {
        $('#bundle_product_classification_selection').val(bundleTypeItems[0].kindtext);
        $('#bundle_product_classification_selection').attr('disabled', true);

    }
    else {
        $('#bundle_product_classification_selection').val('0');
        $('#bundle_product_classification_selection').attr('disabled', false);

    }


    $('#modalChooseBundleProduct').modal('show');

}

function onItemChosenBundleModal() {

    let selectedProductStockIndex = $('input[name="modalBundleProductSelectionInput"]:checked').val();
    let selectedProduct = regularProducts[selectedProductStockIndex];
    regularProducts.splice(selectedProductStockIndex, 1);

    bundleProducts.push({
        'stockId': selectedProduct.id,
        'price': selectedProduct.price,
        'quantity': 1,
        'code': selectedProduct.code,
        'text': selectedProduct.text
    });

    if (bundleTypeBoolean === true) {
        bundleProducts[bundleProducts.length - 1].quantity = bundleTypeItems[0].quantity;
        bundleTypeItems.splice(0, 1);
        updateBundleTypeGuideLink();

        console.log('Here');

    }
    else {


    }


    $('#modalChooseBundleProduct').modal('hide');
    displaySelectedBundleItems();

}
function onChangeBundleQuantity() {
    let arr = $(this).attr('id').split('_');
    let stockId = parseInt(arr[arr.length - 1]);

    let selectedProduct = bundleProducts.find(function (bundleProduct) {
        return bundleProduct.stockId === stockId;
    });
    selectedProduct.quantity = parseInt($(this).val());

    $('#bundle_table_product_price_' + stockId).text(selectedProduct.quantity * selectedProduct.price);
    setTotalPriceBundle();


}

function initialiseAddAnotherItemsModalListeners() {


    $('#id_choose_bundle_product_price_desc').unbind('click');
    $('#id_choose_bundle_product_price_asc').unbind('click');
    $('#id_choose_bundle_product_sold_quantity_desc').unbind('click');
    $('#id_choose_bundle_product_sold_quantity_asc').unbind('click');
    $('#id_choose_bundle_product_stock_quantity_desc').unbind('click');
    $('#id_choose_bundle_product_stock_quantity_asc').unbind('click');
    $('#bundle_product_classification_selection').unbind('change');


    $('#id_choose_bundle_product_price_desc').on('click', function () {

        regularProducts.sort(function (a, b) {
            return -a.price + b.price;
        });
        displayModalChooseBundleProduct();

    });
    $('#id_choose_bundle_product_price_asc').on('click', function () {

        regularProducts.sort(function (a, b) {
            return a.price - b.price;
        });
        displayModalChooseBundleProduct();

    });
    $('#id_choose_bundle_product_sold_quantity_desc').on('click', function () {

        regularProducts.sort(function (a, b) {
            return -a.sold_quantity + b.sold_quantity;
        });
        displayModalChooseBundleProduct();

    });
    $('#id_choose_bundle_product_sold_quantity_asc').on('click', function () {

        regularProducts.sort(function (a, b) {
            return a.sold_quantity - b.sold_quantity;
        });
        displayModalChooseBundleProduct();

    });

    $('#id_choose_bundle_product_stock_quantity_desc').on('click', function () {

        regularProducts.sort(function (a, b) {
            return -a.balance + b.balance;
        });
        displayModalChooseBundleProduct();

    });
    $('#id_choose_bundle_product_stock_quantity_asc').on('click', function () {

        regularProducts.sort(function (a, b) {
            return a.balance - b.balance;
        });
        displayModalChooseBundleProduct();

    });
    $('#bundle_product_classification_selection').change(function () {
        bundleProductClassificationSelectionChanged();
        displayModalChooseBundleProduct();

    });


}
function bundleProductClassificationSelectionChanged() {
    let selectedClassification = $('#bundle_product_classification_selection').val();
    console.log(selectedClassification);

    if (selectedClassification === '0') {
        regularProducts = alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, \
                    stock.balance, item.pclass, stock.obsoleteperiod \
                    FROM stock \
                    JOIN whouse ON whouse.id = stock.whouse \
                    JOIN item ON item.id = stock.item \
                    JOIN kind ON kind.id = item.kind \
                    WHERE whouse.id = 1 and stock.isobsolete = 0');

    }
    else {
        regularProducts = alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, \
                    stock.balance, item.pclass, stock.obsoleteperiod \
                    FROM stock \
                    JOIN whouse ON whouse.id = stock.whouse \
                    JOIN item ON item.id = stock.item \
                    JOIN kind ON kind.id = item.kind \
                    WHERE whouse.id = 1 and stock.isobsolete = 0 and kind.text = ?', [selectedClassification]);
    }

    regularProducts.forEach(function (item, index) {
        item["sold_quantity"] = Math.abs(alasql('SELECT sum(qty) AS sold_quant from trans where stock = ?  and memo = "Sold"',
            [item.id])[0]["sold_quant"]);
    });


}
function setTotalPriceBundle() {
    let sum = 0;
    bundleProducts.forEach(function (product, index) {
        sum += (product.price * product.quantity);

    });
    console.log(sum);

    $('#total_price_bundle').text(sum);
}

function onChangeDiscountAmount() {
    let discounted_amount = parseInt($('#total_price_bundle').text()) - parseInt($('#discount_amount_bundle_input').val());
    $('#discount_amount_bundle').text(discounted_amount);

}

function onBundleTypeChanged() {
    let currentTypeName = $('#bundle_type_selection').val();
    bundleProducts = [{
        'stockId': stock.id,
        'price': stock.price,
        'quantity': 1,
        'code': stock.code,
        'text': stock.text

    }];
    fetchRegularProducts();

    if (currentTypeName === '0') {
        bundleTypeBoolean = false;
        $('#bundleOfferDesc').html('');
        $('#bundleOfferGuide').html('You can choose freely any product in custom bundle offer . ');

        $('#id_bundle_add_another_item_button').attr('disabled', false);
    }
    else {
        bundleTypeBoolean = true;
        bundleTypeItems = alasql('SELECT * from bundletype where typename = ?', [currentTypeName]);

        $('#bundleOfferDesc').html(bundleTypeItems[0].description);
        for (let i = 0; i < bundleTypeItems.length; i++) {
            if (bundleTypeItems[i]["kindtext"] === stock.text) {
                bundleProducts[0].quantity = bundleTypeItems[i]["quantity"];
                bundleTypeItems.splice(i, 1);
                break;
            }
        }

        updateBundleTypeGuideLink();


    }


    displaySelectedBundleItems();

}

function updateBundleTypeGuideLink() {

    if (bundleTypeItems.length === 0) {


        $('#id_bundle_add_another_item_button').attr('disabled', true);
        $('#bundleOfferGuide').html('<span class="glyphicon glyphicon-ok"> You have completed bundle creation');

    }
    else {
        $('#id_bundle_add_another_item_button').attr('disabled', false);
        $('#bundleOfferGuide').html('Please select ' + bundleTypeItems[0].kindtext);

    }

}

/* free functions */

function displayFreeSuggestionTable() {
    let str = '';
    let suggestionFlag = true;

    regularProducts.forEach(function (product, index) {
        let rowColor;
        if (product.price < stock.price) {
            rowColor = 'danger'
        } else {
            if(suggestionFlag === true) {
                rowColor =  'success';
                suggestionFlag = false
            }
            else
            {
                rowColor ='';
            }
        }




        str+= '<tr class="'+ rowColor + '" '+ (rowColor === "danger" ?'data-toggle="tooltip" data-placement="top" title="Price of this product is lower than the free product. "' :'' )+ '>'+
                '<td><input name="inputFreeOfferProductSelection" type="radio" '+ (rowColor === "success" ? "checked" : "" )+'> </td>'+
                '<td>'+ product.code +'</td>'+
                '<td>'+ product.maker +'</td>'+
                '<td>'+ product.price +'</td>'+
                '<td>'+ product.days_since_last_sell +'</td>'+
                '<td>'+ product.sold_quantity +'</td>'+

                '</tr>';


    });


    $('#tbody_free_product_suggestion').html(str);

}

function onProductSuggestionChanged() {
    let freeProductSuggestionSelectedVal = $('#freeProductSuggestionSelection').val();
    if (freeProductSuggestionSelectedVal === '0') {
        regularProducts.sort(function (a, b) {
            if(a.maker === stock.maker && b.maker === stock.maker)
            {
                return -(a.price + 100 * a.days_since_last_sell + a.sold_quantity *10)
                        + (b.price + 100 * b.days_since_last_sell + b.sold_quantity *10)
            }
            else if (a.maker === stock.maker)
            {
               return -1 ;
            }
            else
            {
                return  1;

            }

        });





    }
    else if (freeProductSuggestionSelectedVal === '1') {
        regularProducts.sort(function (a, b) {
            let flag = a.sold_quantity - b.sold_quantity;

            return flag === 0 ? -(a.price + 100 * a.days_since_last_sell + a.sold_quantity *10)+
            (b.price + 100 * b.days_since_last_sell + b.sold_quantity *10) : flag;


        })

    }
    else {

        regularProducts.sort(function (a, b) {

            let flag =  -a.days_since_last_sell + b.days_since_last_sell;
            return flag === 0 ? -(a.price + 100 * a.days_since_last_sell + a.sold_quantity *10)+
                (b.price + 100 * b.days_since_last_sell + b.sold_quantity *10) : flag;
        })


    }
    displayFreeSuggestionTable();

}


/* others */

function plotSaleForecastChart() {
    let discountPercentage = ($('#discount_price_input').val() * 100) / stock.price;
    console.log(discountPercentage, ' sale history');
    let discountProductMultiplier = (discountPercentage * 5) / 100;
    console.log(discountProductMultiplier, ' multiplier');

    let todayDate = getDatefromMS(new Date());
    let allForecastData = alasql('SELECT * from forecast where times > ? and stockid = ?', [todayDate, stock.id]);


    let stopIndex = allForecastData.length - 1;
    let totalQuant = 0;

    for (let i = 0; i < allForecastData.length; i++) {
        allForecastData[i]["quantity"] = Math.round(allForecastData[i]["quantity"] * discountProductMultiplier);
        totalQuant += allForecastData[i]["quantity"];
        if (totalQuant > stock.balance) {
            stopIndex = i;
            break;
        }
    }
    allForecastData.splice(stopIndex + 1);


    console.log(totalQuant, allForecastData);


    let saleForecastData = [];


    for (let i = 0; i < allForecastData.length; i++) {
        let arr = allForecastData[i]["times"].split("-");
        saleForecastData.push([Date.UTC(parseInt(arr[0]), parseInt(arr[1] - 1), parseInt(arr[2])),
            Math.abs(allForecastData[i]["quantity"])]);

    }

    $('#discount_day_need_sale_out').text(allForecastData.length);

    Highcharts.chart('sale_forecast_discount', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Sales forecast after discount applied '
        },
        xAxis: {
            type: 'datetime',
            labels: {
                // rotation: -45,
                style: {
                    fontSize: '13px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Forecast quantity'
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            pointFormat: 'Forecast quantity: <b>{point.y}</b> .'
        },
        series: [{
            name: 'saleForecastData',
            data: saleForecastData,
            dataLabels: {
                enabled: true,
                rotation: 0,
                color: '#FFFFFF',
                align: 'center',
                format: '{point.y}', // one decimal
                y: 10, // 10 pixels down from the top
                style: {
                    //fontSize: '12px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
        }]
    });


}

function getDatefromMS(currentDate) {
    currentDate = new Date(currentDate);
    return currentDate.getFullYear() + '-' + (currentDate.getMonth() >= 9 ? '' : '0') + (currentDate.getMonth() + 1) + '-' + (currentDate.getDate() >= 9 ? '' : '0') + currentDate.getDate();


}
function fetchRegularProducts() {
    regularProducts = alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, \
    stock.balance, item.pclass, stock.obsoleteperiod \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 and stock.isobsolete = 0');


    regularProducts.forEach(function (product, index) {
        product["sold_quantity"] = Math.abs(alasql('SELECT sum(qty) AS sold_quant from trans where stock = ?  and memo = "Sold"',
            [product.id])[0]["sold_quant"]);
        console.log(product)
        let tt = alasql('SELECT last(date) AS last_sale from trans where  memo = "Sold"  and stock = ?', [product.id])[0]["last_sale"];
        console.log(tt);
        tt = tt === undefined ? '2017-01-01' : tt;
        tt = tt.split('-');
        product["days_since_last_sell"] = Math.abs(Math.ceil((new Date() - Date.UTC(parseInt(tt[0]), parseInt(tt[1]) -1, parseInt(tt[2]))) / (24 * 3600 * 1000)));


    });


}