// Includes
const http = require('../util/http.js').func
const getProductInfo = require('./getProductInfo.js').func
const getSellers = require('./getResellers.js').func
const getGeneralToken = require('../util/getGeneralToken.js').func

// Args
exports.required = [['asset', 'product']]
exports.optional = ['price', 'jar']

// Docs
/**
 * 🔐 Buy an asset from the marketplace.
 * @category Assets
 * @param {number} asset - The ID of the product.
 * @param {number=} price - The price of the product.
 * @returns {Promise<BuyAssetResponse>}
 * @example const noblox = require("noblox.js")
 * // Login using your cookie
 * noblox.buy(1117747196)
**/

// Define
function buy(jar, token, product, sellerInfo) {
  const productId = product.ProductId || 1548357
  console.log(productId)
  const httpOpt = {
    url: '//economy.roblox.com/v1/purchases/products/' + productId,
    options: {
      method: 'POST',
      jar: jar,
      headers: {
        'X-CSRF-TOKEN': token
      },
      json: {
        expectedCurrency: 1,
        expectedPrice: sellerInfo.price,
        expectedSellerId: sellerInfo.seller.Id,
        userAssetId: sellerInfo.userAssetId
      }
    }
  }
  return http(httpOpt)
    .then(function (json) {
      try {
        console.log(json)
        let err = json.errorMsg
        if (json.reason === 'InsufficientFunds') {
          err = 'You need ' + json.shortfallPrice + ' more robux to purchase this item.'
        } else if (json.errorMsg) {
          err = json.errorMsg
        }
        if (!err) {
          return { productId, price: sellerInfo.price }
        } else {
          throw new Error(err)
        }
      } catch (error) {
        console.log("error " + error)
      }
    })
}

function getSeller(args, t, jar) {
  const token = t
  return getSellers({
    assetId: args.asset
  })
    .then(function (resellerInfo) {
      resellerInfo = resellerInfo[0]
      console.log(resellerInfo)
      return buy(jar, token, args.product, resellerInfo)
    })
}


function runWithToken(args) {
  const jar = args.jar
  var resellerInfo
  return getGeneralToken({
    jar: jar
  })
    .then(function (token) {
      return getSeller(args, token, jar)
    })
}

exports.func = function (args) {
  if (!args.product) {
    return getProductInfo({
      asset: args.asset
    })
      .then(function (product) {
        args.product = product
        return runWithToken(args)
      })
  } else {
    return runWithToken(args)
  }
}
