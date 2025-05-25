const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const mongoose = require('mongoose');
const Product = require('../models/product');

describe('Product Model', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Validaciones', () => {
        it('debería crear un producto válido', async () => {
            const productData = {
                name: 'Producto Test',
                description: 'Descripción del producto',
                sku: 'TEST123',
                price: 99.99,
                stock: 100,
                minStock: 10,
                category: 'Test'
            };

            const product = new Product(productData);
            const savedProduct = await product.save();

            expect(savedProduct).to.have.property('_id');
            expect(savedProduct.name).to.equal(productData.name);
            expect(savedProduct.sku).to.equal(productData.sku);
            expect(savedProduct.price).to.equal(productData.price);
            expect(savedProduct.stock).to.equal(productData.stock);
            expect(savedProduct.minStock).to.equal(productData.minStock);
            expect(savedProduct.category).to.equal(productData.category);
            expect(savedProduct.status).to.equal('active');
        });

        it('debería fallar al crear un producto sin campos requeridos', async () => {
            const product = new Product({});

            try {
                await product.save();
                expect.fail('Debería haber fallado');
            } catch (error) {
                expect(error).to.be.instanceOf(mongoose.Error.ValidationError);
                expect(error.errors).to.have.property('name');
                expect(error.errors).to.have.property('sku');
                expect(error.errors).to.have.property('price');
                expect(error.errors).to.have.property('currentStock');
                expect(error.errors).to.have.property('minStock');
                expect(error.errors).to.have.property('category');
            }
        });

        it('debería fallar al crear un producto con SKU duplicado', async () => {
            const productData = {
                name: 'Producto Test',
                sku: 'TEST123',
                price: 99.99,
                stock: 100,
                minStock: 10,
                category: 'Test'
            };

            await Product.create(productData);

            const duplicateProduct = new Product(productData);
            try {
                await duplicateProduct.save();
                expect.fail('Debería haber fallado');
            } catch (error) {
                expect(error).to.be.instanceOf(mongoose.Error.ValidationError);
                expect(error.code).to.equal(11000);
            }
        });
    });

    describe('Métodos', () => {
        let product;

        beforeEach(async () => {
            product = await Product.create({
                name: 'Producto Test',
                sku: 'TEST123',
                price: 99.99,
                stock: 100,
                minStock: 10,
                category: 'Test'
            });
        });

        it('debería actualizar el stock correctamente', async () => {
            await product.updateStock(50);
            expect(product.stock).to.equal(150);

            await product.updateStock(-30);
            expect(product.stock).to.equal(120);
        });

        it('debería fallar al intentar reducir el stock por debajo de 0', async () => {
            try {
                await product.updateStock(-150);
                expect.fail('Debería haber fallado');
            } catch (error) {
                expect(error.message).to.equal('Stock insuficiente');
            }
        });

        it('debería detectar stock bajo', async () => {
            product.stock = 5;
            expect(product.checkLowStock()).to.be.true;

            product.stock = 15;
            expect(product.checkLowStock()).to.be.false;
        });
    });

    describe('Métodos estáticos', () => {
        beforeEach(async () => {
            await Product.create([
                {
                    name: 'Producto 1',
                    sku: 'TEST1',
                    price: 99.99,
                    stock: 5,
                    minStock: 10,
                    category: 'Test1',
                    status: 'active'
                },
                {
                    name: 'Producto 2',
                    sku: 'TEST2',
                    price: 149.99,
                    stock: 15,
                    minStock: 10,
                    category: 'Test2',
                    status: 'active'
                },
                {
                    name: 'Producto 3',
                    sku: 'TEST3',
                    price: 199.99,
                    stock: 8,
                    minStock: 10,
                    category: 'Test1',
                    status: 'inactive'
                }
            ]);
        });

        it('debería encontrar productos por categoría', async () => {
            const products = await Product.findByCategory('Test1');
            expect(products).to.have.lengthOf(1);
            expect(products[0].category).to.equal('Test1');
        });

        it('debería encontrar productos con stock bajo', async () => {
            const products = await Product.findLowStock();
            expect(products).to.have.lengthOf(1);
            expect(products[0].stock).to.be.below(products[0].minStock);
        });
    });

    describe('Virtuals', () => {
        let product;

        beforeEach(async () => {
            product = await Product.create({
                name: 'Producto Test',
                sku: 'TEST123',
                price: 99.99,
                stock: 5,
                minStock: 10,
                category: 'Test'
            });
        });

        it('debería calcular correctamente isLowStock', () => {
            expect(product.isLowStock).to.be.true;

            product.stock = 15;
            expect(product.isLowStock).to.be.false;
        });

        it('debería calcular correctamente stockValue', () => {
            expect(product.stockValue).to.equal(499.95); // 5 * 99.99
        });
    });
}); 