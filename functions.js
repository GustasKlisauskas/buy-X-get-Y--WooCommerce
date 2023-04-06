// Function to get the promotion options
function get_promotion_options() {
    return array(
        'free_product_id' => 1475, // ID of the free product
        'qualifying_product_ids' => array( 1781 ) // IDs of the products that qualify for the promotion
    );
}

// Function to add the free product to the cart when a qualifying product is added
function add_free_product_to_cart( $cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data ) {
    $options = get_promotion_options();
    $free_product_id = $options['free_product_id'];
    $qualifying_product_ids = $options['qualifying_product_ids'];

    // Check if the added product qualifies for the promotion
    if ( in_array( $product_id, $qualifying_product_ids ) ) {
        $cart = WC()->cart;
        $free_product_cart_key = $cart->generate_cart_id( $free_product_id );
        $free_product = $cart->find_product_in_cart( $free_product_cart_key );

        // If the free product is not in the cart, add it
        if ( ! $free_product ) {
            $free_product_cart_item_key = $cart->add_to_cart( $free_product_id, $quantity );
            if ( $free_product_cart_item_key ) {
                $cart->cart_contents[ $free_product_cart_item_key ]['data']->set_price( 0 );
            }
        }
    }
}
add_action( 'woocommerce_add_to_cart', 'add_free_product_to_cart', 10, 6 );

// Function to set the price of the free product to zero if the conditions are met
function set_free_product_price_to_zero( $cart ) {
    $options = get_promotion_options();
    $free_product_id = $options['free_product_id'];
    $qualifying_product_ids = $options['qualifying_product_ids'];

    // Count the quantity of qualifying products in the cart
    $qualifying_product_count = 0;
    foreach ( $cart->get_cart() as $cart_item ) {
        if ( in_array( $cart_item['product_id'], $qualifying_product_ids ) ) {
            $qualifying_product_count += $cart_item['quantity'];
        }
    }

    // Count the quantity of free products in the cart
    $free_product_count = 0;
    foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) {
        if ( $cart_item['product_id'] == $free_product_id ) {
            $free_product_count += $cart_item['quantity'];
        }
    }
    
    // Set the price of the free product to zero or its regular price, based on the quantity of qualifying products
    foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) {
        if ( $cart_item['product_id'] == $free_product_id ) {
            if ( $qualifying_product_count >= $free_product_count ) {
                $cart->cart_contents[ $cart_item_key ]['data']->set_price( 0 );
            } else {
                $additional_free_products = $free_product_count - $qualifying_product_count;
                if ( $additional_free_products > 0 ) {
                    $cart->cart_contents[ $cart_item_key ]['data']->set_price( $cart->cart_contents[ $cart_item_key ]['data']->get_regular_price() );
                    $additional_free_products--;
                } else {
                    $cart->cart_contents[ $cart_item_key ]['data']->set_price( 0 );
                }
            }
        }
    }
}
add_action( 'woocommerce_before_calculate_totals', 'set_free_product_price_to_zero', 10, 1 );

// Function to update the free product quantity when the quantity of a qualifying product is updated
function update_free_product_quantity( $cart_item_key, $quantity, $old_quantity ) {
    $options = get_promotion_options();
    $free_product_id = $options['free_product_id'];
    $qualifying_product_ids = $options['qualifying_product_ids'];

    $cart = WC()->cart;
    $cart_item = $cart->get_cart_item( $cart_item_key );

    if ( in_array( $cart_item['product_id'], $qualifying_product_ids ) ) {
        $free_product_cart_key = $cart->generate_cart_id( $free_product_id );
        $free_product = $cart->find_product_in_cart( $free_product_cart_key );

        if ( $free_product ) {
            $new_free_product_quantity = $cart->cart_contents[ $free_product_cart_key ]['quantity'] + ( $quantity - $old_quantity );
            $cart->set_quantity( $free_product_cart_key, $new_free_product_quantity, true );
        }
    }
}
add_action( 'woocommerce_after_cart_item_quantity_update', 'update_free_product_quantity', 10, 3 );

// Function to disable quantity input for the free product
function disable_quantity_input_for_free_product( $input, $cart_item, $cart_item_key ) {
    $options = get_promotion_options();
    $free_product_id = $options['free_product_id'];

    if ( $cart_item['product_id'] == $free_product_id ) {
        $input = sprintf( '<input type="hidden" name="cart[%s][qty]" value="%s" /><span class="free-product-quantity">%s</span>', $cart_item_key, $cart_item['quantity'], $cart_item['quantity'] );
    }

    return $input;
}

// Function to add the text to the Q product's title
function add_free_product_text_to_title( $title, $id = null ) {
    $options = get_promotion_options();
    $qualifying_product_ids = $options['qualifying_product_ids'];

    if ( ! $id ) {
        $id = get_the_ID();
    }

    if ( in_array( $id, $qualifying_product_ids ) ) {
        $title .= ' <br><span class="free-product-text"> +Gift - HAYEJIN Pale Green Pastel Eye Mask, 34 EUR </span>'; // Add the free product name and text
    }

    return $title;
}

// Modify the title on the shop page
function modify_shop_page_title() {
    add_filter( 'the_title', 'add_free_product_text_to_title', 10, 2 );
}
add_action( 'woocommerce_shop_loop_item_title', 'modify_shop_page_title', 9 );

// Modify the title on the single product page
function modify_single_product_title() {
    add_filter( 'the_title', 'add_free_product_text_to_title', 10, 2 );
}
add_action( 'woocommerce_single_product_summary', 'modify_single_product_title', 4 );

// Remove the title filter after it has been used
function remove_title_filter() {
    remove_filter( 'the_title', 'add_free_product_text_to_title', 10, 2 );
}
add_action( 'woocommerce_after_shop_loop_item_title', 'remove_title_filter', 11 );
add_action( 'woocommerce_after_single_product_summary', 'remove_title_filter', 6 );

// Function to add the gift text to the free product in the cart
function add_gift_text_to_free_product( $product_name, $cart_item, $cart_item_key ) {
    $options = get_promotion_options();
    $free_product_id = $options['free_product_id'];

    if ( $cart_item['product_id'] == $free_product_id && $cart_item['data']->get_price() == 0 ) {
        $product_name .= ' <span class="free-product-text">-DOVANA</span>'; // Add the gift text
    }

    return $product_name;
}
add_filter( 'woocommerce_cart_item_name', 'add_gift_text_to_free_product', 10, 3 );

// Function to update the cart prices when the cart is opened
function update_cart_prices_on_cart_open() {
    if ( is_cart() ) {
        $cart = WC()->cart;
        set_free_product_price_to_zero( $cart );
        $cart->calculate_totals();
    }
}
add_action( 'template_redirect', 'update_cart_prices_on_cart_open' );
