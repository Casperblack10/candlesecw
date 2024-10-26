let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Update cart in localStorage whenever it changes
function updateCartInLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Fetch products from the API
async function fetchProducts() {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '<p>Loading products...</p>';

    try {
        const response = await fetch('http://localhost:3000/products');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const products = await response.json();

        if (!Array.isArray(products) || products.length === 0) {
            productList.innerHTML = 'Currently, no products are available.';
            return;
        }

        displayProducts(products);

    } catch (error) {
        console.error('Error fetching products:', error);
        productList.innerHTML = 'Failed to load products.';
    }
}

// Display products in the product list
function displayProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';

        const price = parseFloat(product.price);
        const formattedPrice = isNaN(price) ? 'N/A' : price.toFixed(2);

        productItem.innerHTML = `
            <h3>${product.name}</h3>
            <p>Price: $${formattedPrice}</p>
            <button class="add-to-cart" onclick="addToCart('${product.id}', this)">Add to Cart</button>
        `;
        productList.appendChild(productItem);
    });
}

// Call the fetchProducts function when the page loads
window.onload = fetchProducts;

// Function to add a product to the cart
function addToCart(productId, button) {
    // Disable the button temporarily to prevent multiple clicks
    button.disabled = true;

    fetch(`http://localhost:3000/products/${productId}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(product => {
            const existingProduct = cart.find(item => item.id === product.id);

            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
            }

            updateCartInLocalStorage();
            alert(`${product.name} added to cart!`);
            renderCartItems(); // Updates cart display

            // Re-enable the button after adding to cart
            setTimeout(() => (button.disabled = false), 1000);
        })
        .catch(err => {
            console.error('Error fetching product:', err);
            button.disabled = false; // Re-enable if an error occurs
        });
}
