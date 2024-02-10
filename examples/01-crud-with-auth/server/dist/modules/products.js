"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onProductsChange = exports.deleteProduct = exports.createProduct = exports.updateProduct = exports.getProduct = exports.getAllProducts = void 0;
var flayer_1 = require("flayer");
var guards_1 = require("../guards");
var util_1 = require("../util");
// Product change callback listeners
var listeners = [];
var products = [
    { id: 1, name: "Product 1", price: 100, createdAt: new Date() },
    { id: 2, name: "Product 2", price: 200, createdAt: new Date() },
    { id: 3, name: "Product 3", price: 300, createdAt: new Date() },
    { id: 4, name: "Product 4", price: 400, createdAt: new Date() },
];
/**
 * Notify all listeners that the products were changed
 */
function notifyProductsChanged() {
    listeners.forEach(function (callback) {
        callback(products);
    });
}
/**
 * Get all products from the database
 * @returns All products
 */
function getAllProducts() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, guards_1.assertIsLoggedIn)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, util_1.sleep)(1000)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, __spreadArray([], products, true)];
            }
        });
    });
}
exports.getAllProducts = getAllProducts;
/**
 * Get a product by ID
 * @param id Product ID
 * @returns Product
 */
function getProduct(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, guards_1.assertIsLoggedIn)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, util_1.sleep)(1000)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, products.find(function (product) { return product.id === id; })];
            }
        });
    });
}
exports.getProduct = getProduct;
/**
 * Updates an existing product
 * @param id Product ID
 * @param product Product
 * @returns Product
 */
function updateProduct(id, product) {
    return __awaiter(this, void 0, void 0, function () {
        var index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, guards_1.assertIsAdmin)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, util_1.sleep)(1000)];
                case 2:
                    _a.sent();
                    index = products.findIndex(function (p) { return p.id === id; });
                    if (index === -1) {
                        throw new Error("Product with ID ".concat(id, " not found"));
                    }
                    products[index] = product;
                    notifyProductsChanged();
                    return [2 /*return*/, product];
            }
        });
    });
}
exports.updateProduct = updateProduct;
/**
 * Creates a new product
 * @param product Product (without ID and created at)
 * @returns Product
 */
function createProduct(product) {
    return __awaiter(this, void 0, void 0, function () {
        var id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, guards_1.assertIsAdmin)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, util_1.sleep)(1000)];
                case 2:
                    _a.sent();
                    id = Math.max.apply(Math, products.map(function (product) { return product.id; })) + 1;
                    products.push(__assign(__assign({}, product), { id: id, createdAt: new Date() }));
                    notifyProductsChanged();
                    return [2 /*return*/, product];
            }
        });
    });
}
exports.createProduct = createProduct;
/**
 * Deletes a product
 * @param id Product ID
 * @returns Was the product deleted?
 */
function deleteProduct(id) {
    return __awaiter(this, void 0, void 0, function () {
        var index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, guards_1.assertIsAdmin)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, util_1.sleep)(1000)];
                case 2:
                    _a.sent();
                    index = products.findIndex(function (p) { return p.id === id; });
                    if (index === -1) {
                        throw new Error("Product with ID ".concat(id, " not found"));
                    }
                    products.splice(index, 1);
                    notifyProductsChanged();
                    return [2 /*return*/, true];
            }
        });
    });
}
exports.deleteProduct = deleteProduct;
/**
 * Assign a listener that gets executed whenever products are changed.
 * @param callback Callback function
 */
function onProductsChange(callback) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            listeners.push(callback);
            (0, flayer_1.onDisconnect)(function () {
                listeners = listeners.filter(function (listener) { return listener !== callback; });
            });
            return [2 /*return*/];
        });
    });
}
exports.onProductsChange = onProductsChange;
