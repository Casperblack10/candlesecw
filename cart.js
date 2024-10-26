let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Function to update localStorage when the cart changes
function updateCartInLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Function to render the cart items on the page
function renderCartItems() {
    const cartList = document.querySelector('.cart-list');
    cartList.innerHTML = '';

    // Debugging: log the cart contents before rendering
    console.log('Rendering cart items:', cart);

    if (cart.length === 0) {
        cartList.innerHTML = '<p>Your cart is empty.</p>';
        document.getElementById('cart-actions').classList.add('hidden');
        document.getElementById('checkout').classList.add('hidden');
        return;
    }

    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <p>${item.name} - $${item.price.toFixed(2)} x ${item.quantity}</p>
            <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
        `;
        cartList.appendChild(itemDiv);
    });

    document.getElementById('cart-actions').classList.remove('hidden');
    document.getElementById('checkout').classList.remove('hidden');
}

// Call this function on page load to display items
document.addEventListener('DOMContentLoaded', () => {
    renderCartItems();
});

// Function to remove an item from the cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartInLocalStorage();
    renderCartItems();
    alert('Item removed from cart.');
}

// Event listener for complete purchase button
document.getElementById('complete-purchase').addEventListener('click', () => {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const cardNumber = document.getElementById('card-number').value;
    const cvv = document.getElementById('cvv').value;

    const cardNumberPattern = /^\d{4} \d{4} \d{4} \d{4}$/;
    const cvvPattern = /^\d{3,4}$/;

    if (!name || !email || !address || !cardNumberPattern.test(cardNumber) || !cvvPattern.test(cvv)) {
        alert('Please fill in all fields and ensure card details are correct.');
        return;
    }

    const orderData = {
        name,
        email,
        address,
        cardNumber,
        cvv,
        cart
    };

    fetch('/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (response.ok) {
            alert('Thank you for your purchase!');
            localStorage.removeItem('cart');
            cart = [];
            renderCartItems();
            document.getElementById('checkout-form').reset();
        } else {
            alert('There was an error processing your order. Please try again.');
        }
    })
    .catch(err => {
        console.error('Error during checkout:', err);
        alert('An error occurred. Please try again.');
    });
});

// Function to add a product to the cart (adjust this as necessary)
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += product.quantity; // Increase quantity
    } else {
        cart.push(product); // Add new product
    }
    updateCartInLocalStorage();
    renderCartItems();
}

// Sample function for adding a product (adjust according to your actual product logic)
function addProductToCart(productId) {
    // Example product fetching logic
    const product = { id: productId, name: "Sample Product", price: 19.99, quantity: 1 }; // Example product
    addToCart(product);
}
