require('dotenv').config();
const axios = require('axios');
const minimist = require('minimist');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2023-10/graphql.json`;

const args = minimist(process.argv.slice(2));
const productName = args.name || '';

if (!productName) {
  console.error('Error: Please provide a product name using --name');
  process.exit(1);
}

const queryProducts = `
  query($query: String!) {
    products(first: 10, query: $query) {
      edges {
        node {
          title
          variants(first: 100) {
            edges {
              node {
                title
                price
              }
            }
          }
        }
      }
    }
  }
`;

const queryAll = `
    query {
        products(first: 100) {
      edges {
        node {
          title
          variants(first: 100) {
            edges {
              node {
                title
                price
              }
            }
          }
        }
      }
        }
    }
`;

async function fetchProducts() {
  try {
    const response = await axios.post(
      API_URL,
      { query: queryProducts, variables: { query: `title:*${productName}*` } },
      { headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN, 'Content-Type': 'application/json' } }
    );

    const products = response.data.data.products.edges;
    if (!products.length) {
      console.log(`No products found for "${productName}".`);
      return;
    }

    const variantsList = [];
    products.forEach(({ node: product }) => {
      product.variants.edges.forEach(({ node: variant }) => {
        variantsList.push({
          productTitle: product.title,
          variantTitle: variant.title,
          price: parseFloat(variant.price),
        });
      });
    });

    variantsList.sort((a, b) => a.price - b.price);

    variantsList.forEach(({ productTitle, variantTitle, price }) => {
      console.log(`${productTitle} - ${variantTitle} - price $${price}`);
    });
  } catch (error) {
    console.error('Error fetching products:', error.response?.data || error.message);
  }
}

fetchProducts();