/**
 * Created by rahman_ma-pc on 4/4/2017.
 */

// var retId = parseInt($.url().param('ret'));


var kindOptions = '';
alasql('SELECT * from kind;').forEach(function (it,index) {
    kindOptions += '<option value="'+ it['text'] +'">'+ it['text']+ '</option>';
});

var totalBundleProduct = 0;


$('#bundle_total_product_create_new').on('keyup',onChangeBundleTotalProduct);
function onChangeBundleTotalProduct() {
    totalBundleProduct = parseInt($('#bundle_total_product_create_new').val());

    let str = '';

    for(let i = 1; i<= totalBundleProduct ; i++)
    {
        str += '<tr><td>'+ i+'</td>';
        str += '<td><select class="form-control" id="select_kind_'+i+'">'+kindOptions+'</select></td>';
        str+= '<td><input class="form-control" id="input_quantity_'+i+'" type="number" value="1"></td>';

    }

    $('#tbody_new_bundle_type').html(str);



}


function onClickBundleCreate()
{
    let bundlename = $('#bundle_name_create_new').val();
    let bundleDetails = $('#bundle_details_create_new').val();

    for(let i = 1 ; i<=totalBundleProduct; i++)
    {

        let kindtext = $('#select_kind_'+i).val();
        let kindquant = $('#input_quantity_'+i).val();


        let bundletypeid = alasql('SELECT max(id)+1 AS max_id from bundletype')[0]['max_id'];

        console.log(bundletypeid , bundlename ,  kindtext , kindquant , bundleDetails );

        alasql('INSERT INTO bundletype (id, typename , kindtext , quantity , description) VALUES(?,?,?,?,?);',[ bundletypeid , bundlename ,  kindtext , kindquant , bundleDetails ] );

    }


    alert(' New bundle  created with name '+bundlename);

     // window.location.replace('new-promotion.html?id='+retId);



}