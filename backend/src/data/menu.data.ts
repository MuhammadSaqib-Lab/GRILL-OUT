// AUTO-GENERATED — do not hand-edit.
//
// Source of truth is the frontend itself: this file is a straight port of
// the IMG bank + MENU_ITEMS + CATEGORIES arrays in ../../../js/script.js,
// produced by backend/scripts/generate-menu-data.js. Names, prices,
// descriptions, images and categories are copied verbatim from the live
// frontend so this mock data layer can never drift from what the site
// actually shows.
//
// This is Phase-1 in-memory seed data (see repositories/menu.repository.ts).
// Phase 2 replaces the array underneath the repository with a real
// database table — the MenuItem shape below is the contract the rest of
// the backend (services, controllers, API responses) is written against,
// so that swap should not require touching anything outside the
// repository implementation.

import type { Category, MenuItem } from "../types/menu.types";

export const CATEGORIES: Category[] = [
  {
    "key": "pizza-special",
    "label": "Special Pizzas"
  },
  {
    "key": "pizza-regular",
    "label": "Regular Pizzas"
  },
  {
    "key": "appetizers",
    "label": "Appetizers"
  },
  {
    "key": "burgers",
    "label": "Burgers"
  },
  {
    "key": "steaks",
    "label": "Steaks"
  },
  {
    "key": "pasta",
    "label": "Pasta & More"
  },
  {
    "key": "wraps",
    "label": "Wraps & Special Fries"
  },
  {
    "key": "broast",
    "label": "Chicken Corner"
  },
  {
    "key": "meal-deals",
    "label": "Meal Deals"
  },
  {
    "key": "wow-deals",
    "label": "Wow Deals"
  },
  {
    "key": "family-deals",
    "label": "Family Deals"
  },
  {
    "key": "party-kids",
    "label": "Party & Kids Deals"
  },
  {
    "key": "welcome-deals",
    "label": "Welcome Deals"
  },
  {
    "key": "soups",
    "label": "Soups"
  },
  {
    "key": "wings",
    "label": "Wings"
  },
  {
    "key": "thai-chinese",
    "label": "Thai Chinese & Rice"
  },
  {
    "key": "hot-station",
    "label": "Hot Station"
  },
  {
    "key": "cold-station",
    "label": "Cold Station"
  },
  {
    "key": "desserts-shakes",
    "label": "Sundaes & Shakes"
  },
  {
    "key": "bubble-frappe",
    "label": "Bubble Tea & Frappé"
  }
];

export const MENU_ITEMS: MenuItem[] = [
  {
    "id": 1,
    "name": "Crown Crust Pizza",
    "description": "Cheese-stuffed crown crust with special chicken, capsicum, onion & olives in creamy white sauce.",
    "price": 1399,
    "category": "pizza-special",
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "options": [
      {
        "label": "M",
        "price": 1399
      },
      {
        "label": "L",
        "price": 1949
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 2,
    "name": "Square Pizza",
    "description": "Special chicken, capsicum, onion & olives on a crisp square crust with white sauce.",
    "price": 849,
    "category": "pizza-special",
    "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "S",
        "price": 849
      },
      {
        "label": "M",
        "price": 1399
      },
      {
        "label": "L",
        "price": 1949
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 3,
    "name": "Stuffed Crust Pizza",
    "description": "Special chicken, seekh kabab, capsicum, onion, mushroom & olives, stuffed crust, white sauce.",
    "price": 1449,
    "category": "pizza-special",
    "image": "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "options": [
      {
        "label": "M",
        "price": 1449
      },
      {
        "label": "L",
        "price": 2049
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 4,
    "name": "Shahi Mughlai",
    "description": "Mughlai chicken, onion & capsicum finished with our special white sauce.",
    "price": 849,
    "category": "pizza-special",
    "image": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "S",
        "price": 849
      },
      {
        "label": "M",
        "price": 1249
      },
      {
        "label": "L",
        "price": 1799
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 5,
    "name": "Grill Out Special",
    "description": "Our house-signature pizza loaded with a generous mix of toppings.",
    "price": 849,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "options": [
      {
        "label": "S",
        "price": 849
      },
      {
        "label": "M",
        "price": 1299
      },
      {
        "label": "L",
        "price": 1849
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 6,
    "name": "Seekh Kabab",
    "description": "Spiced seekh kabab, onion & capsicum topped with our special sauce.",
    "price": 899,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "S",
        "price": 899
      },
      {
        "label": "M",
        "price": 1399
      },
      {
        "label": "L",
        "price": 1949
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 7,
    "name": "Karara Tikka Pizza",
    "description": "Special chicken, capsicum, onion & jalapeno with olives for a fiery kick.",
    "price": 1249,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "options": [
      {
        "label": "M",
        "price": 1249
      },
      {
        "label": "L",
        "price": 1749
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 8,
    "name": "Chicken Supreme",
    "description": "Chicken tikka, crushed kabab, capsicum & tomatoes on a loaded base.",
    "price": 849,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "S",
        "price": 849
      },
      {
        "label": "M",
        "price": 1249
      },
      {
        "label": "L",
        "price": 1799
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 9,
    "name": "Chicken Tikka",
    "description": "Classic chicken tikka, onion & capsicum on a bed of melted cheese.",
    "price": 849,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "S",
        "price": 849
      },
      {
        "label": "M",
        "price": 1249
      },
      {
        "label": "L",
        "price": 1799
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 10,
    "name": "Chicken Fajita",
    "description": "Fajita chicken, onion, capsicum, olives & tomatoes for a zesty bite.",
    "price": 849,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "S",
        "price": 849
      },
      {
        "label": "M",
        "price": 1249
      },
      {
        "label": "L",
        "price": 1799
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 11,
    "name": "Chicken Tandoori",
    "description": "Hot 'n' spicy tandoori chicken, capsicum, onion & jalapeno with chilli flakes.",
    "price": 849,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "options": [
      {
        "label": "S",
        "price": 849
      },
      {
        "label": "M",
        "price": 1249
      },
      {
        "label": "L",
        "price": 1799
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 12,
    "name": "Peri Peri Special",
    "description": "Peri peri chicken, capsicum, mushroom, onion & olives finished with peri peri sauce.",
    "price": 849,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "options": [
      {
        "label": "S",
        "price": 849
      },
      {
        "label": "M",
        "price": 1249
      },
      {
        "label": "L",
        "price": 1799
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 13,
    "name": "Cheese Lover",
    "description": "Our special pizza sauce topped with cheese, and a bit more cheese.",
    "price": 849,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "options": [
      {
        "label": "S",
        "price": 849
      },
      {
        "label": "M",
        "price": 1249
      },
      {
        "label": "L",
        "price": 1799
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 14,
    "name": "Hot n Spicy",
    "description": "Spicy fajita chicken, jalapeno, onion, capsicum & chilli flakes.",
    "price": 849,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "options": [
      {
        "label": "S",
        "price": 849
      },
      {
        "label": "M",
        "price": 1249
      },
      {
        "label": "L",
        "price": 1799
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 15,
    "name": "Grill Out Special Platter",
    "description": "A hearty mixed platter fresh off the grill — great for sharing.",
    "price": 1299,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 16,
    "name": "Calzone",
    "description": "Folded pizza dough stuffed with melted cheese & filling, baked golden.",
    "price": 999,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1753656681797-3234c89d6d4d?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 17,
    "name": "Cheezy Sticks",
    "description": "Golden breaded sticks with a molten mozzarella pull.",
    "price": 699,
    "category": "pizza-regular",
    "image": "https://images.unsplash.com/photo-1778449665117-2c607bbc7415?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 18,
    "name": "Plain Fries",
    "description": "Classic crispy golden fries, lightly salted.",
    "price": 399,
    "category": "appetizers",
    "image": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "M",
        "price": 399
      },
      {
        "label": "L",
        "price": 449
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 19,
    "name": "Mayo Fries",
    "description": "Crispy fries tossed in creamy house-made mayo.",
    "price": 449,
    "category": "appetizers",
    "image": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "M",
        "price": 449
      },
      {
        "label": "L",
        "price": 549
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 20,
    "name": "Nuggets",
    "description": "Golden breaded chicken nuggets, crispy on the outside, juicy within.",
    "price": 449,
    "category": "appetizers",
    "image": "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "5 Pcs",
        "price": 449
      },
      {
        "label": "10 Pcs",
        "price": 799
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 21,
    "name": "Ba Zinga",
    "description": "Crispy fried chicken fillet, melted cheese & our signature peri peri sauce.",
    "price": 599,
    "category": "burgers",
    "image": "https://images.unsplash.com/photo-1637710847214-f91d99669e18?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 22,
    "name": "Jack's Grilled Burger",
    "description": "Flame-grilled chicken breast, fresh lettuce, tomato & smoky mayo.",
    "price": 599,
    "category": "burgers",
    "image": "https://images.unsplash.com/photo-1692737349870-e3bfc704ebf9?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 23,
    "name": "Flammer",
    "description": "Spiced beef patty stacked high with a fiery house sauce.",
    "price": 649,
    "category": "burgers",
    "image": "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 24,
    "name": "Flango",
    "description": "Grilled chicken layered with tangy mango-chilli glaze.",
    "price": 649,
    "category": "burgers",
    "image": "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 25,
    "name": "Rock Star Grilled Burger",
    "description": "Char-grilled beef patty, melted cheese & crispy onions.",
    "price": 699,
    "category": "burgers",
    "image": "https://images.unsplash.com/photo-1549611016-3a70d82b5040?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 26,
    "name": "Lava Burger",
    "description": "Double beef patty smothered in melted cheese and a fiery lava sauce.",
    "price": 699,
    "category": "burgers",
    "image": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 27,
    "name": "Fillet o Fire",
    "description": "Crispy fish fillet with a spicy tartare kick.",
    "price": 599,
    "category": "burgers",
    "image": "https://images.unsplash.com/photo-1615297928064-24977384d0da?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 28,
    "name": "Crispo",
    "description": "Crispy chicken fillet, lettuce & mayo on a toasted bun.",
    "price": 449,
    "category": "burgers",
    "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 29,
    "name": "Beef Steak Burger",
    "description": "Thick-cut beef steak patty with all the classic fixings.",
    "price": 749,
    "category": "burgers",
    "image": "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 30,
    "name": "Zooper Beef",
    "description": "Loaded double beef patty burger built for big appetites.",
    "price": 649,
    "category": "burgers",
    "image": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 31,
    "name": "Mexican Grilled Steak",
    "description": "Bold Mexican spice rub, chargrilled and served sizzling hot.",
    "price": 1699,
    "category": "steaks",
    "image": "https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "options": [
      {
        "label": "Chicken",
        "price": 1699
      },
      {
        "label": "Beef",
        "price": 2299
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 32,
    "name": "Tarragon Grilled Steak",
    "description": "Fresh tarragon herb marinade, grilled over an open flame.",
    "price": 1699,
    "category": "steaks",
    "image": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Chicken",
        "price": 1699
      },
      {
        "label": "Beef",
        "price": 2299
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 33,
    "name": "Mushroom Grilled Steak",
    "description": "Finished with a rich mushroom sauce for an earthy, savory bite.",
    "price": 1699,
    "category": "steaks",
    "image": "https://images.unsplash.com/photo-1683315446874-e6a629087ef8?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Chicken",
        "price": 1699
      },
      {
        "label": "Beef",
        "price": 2299
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 34,
    "name": "Moroccan Grilled Steak",
    "description": "Warm Moroccan spice blend, grilled low and slow for deep flavor.",
    "price": 1699,
    "category": "steaks",
    "image": "https://images.unsplash.com/photo-1633436375795-12b3b339712f?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Chicken",
        "price": 1699
      },
      {
        "label": "Beef",
        "price": 2299
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 35,
    "name": "Smoky BBQ Grilled Steak",
    "description": "Basted in a smoky BBQ glaze and seared to perfection.",
    "price": 1699,
    "category": "steaks",
    "image": "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "options": [
      {
        "label": "Chicken",
        "price": 1699
      },
      {
        "label": "Beef",
        "price": 2299
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 36,
    "name": "Krunchy Pasta",
    "description": "Penne tossed in a bold red sauce with a crunchy topping.",
    "price": 899,
    "category": "pasta",
    "image": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 37,
    "name": "Flaming Pasta",
    "description": "Fiery chilli-infused pasta for the heat-seekers.",
    "price": 899,
    "category": "pasta",
    "image": "https://images.unsplash.com/photo-1528738064262-9f834cbdfda1?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 38,
    "name": "Alfredo Fresco",
    "description": "Silky, creamy alfredo sauce tossed through fettuccine.",
    "price": 999,
    "category": "pasta",
    "image": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 39,
    "name": "Grill Out Special Lasagne",
    "description": "Layers of pasta, rich meat sauce & melted cheese, oven-baked.",
    "price": 949,
    "category": "pasta",
    "image": "https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 40,
    "name": "Behari Roll",
    "description": "Spiced behari beef rolled in a soft paratha wrap.",
    "price": 699,
    "category": "wraps",
    "image": "https://images.unsplash.com/photo-1665469222949-3de88d37ee5a?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 41,
    "name": "Arabic Roll",
    "description": "Grilled chicken, garlic sauce & pickles in a warm Arabic wrap.",
    "price": 699,
    "category": "wraps",
    "image": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 42,
    "name": "Fajita Wrap",
    "description": "Grilled fajita chicken wrapped with crunchy slaw.",
    "price": 449,
    "category": "wraps",
    "image": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 43,
    "name": "Loaded Cheese Fries",
    "description": "Golden fries loaded with melted cheese & house sauce.",
    "price": 649,
    "category": "wraps",
    "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 44,
    "name": "Loaded Pizza Fries",
    "description": "Fries topped with pizza sauce, mozzarella & toppings.",
    "price": 699,
    "category": "wraps",
    "image": "https://images.unsplash.com/photo-1639744210631-209fce3e256c?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 45,
    "name": "Chilli Cheese Fries",
    "description": "Crispy fries smothered in chilli-cheese sauce.",
    "price": 549,
    "category": "wraps",
    "image": "https://images.unsplash.com/photo-1666304752980-678d5c35c911?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 46,
    "name": "Arabic Broast",
    "description": "Crispy golden broasted chicken, marinated in our secret spice blend.",
    "price": 349,
    "category": "broast",
    "image": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "1 Pc",
        "price": 349
      },
      {
        "label": "2 Pcs",
        "price": 649
      },
      {
        "label": "5 Pcs",
        "price": 1599
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 47,
    "name": "Smoke & Grill Chicken",
    "description": "Smoke-grilled chicken piece served with dip, or as a full meal.",
    "price": 399,
    "category": "broast",
    "image": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "options": [
      {
        "label": "1 Pc + Dip",
        "price": 399
      },
      {
        "label": "1 Pc Meal",
        "price": 499
      },
      {
        "label": "2 Pcs Meal",
        "price": 1049
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 48,
    "name": "Meal Deal 01",
    "description": "1 Ba Zinga Burger + Medium Fries + 345ml Drink.",
    "price": 969,
    "category": "meal-deals",
    "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 49,
    "name": "Meal Deal 02",
    "description": "1 Jack's Grilled Burger + Medium Fries + 345ml Drink.",
    "price": 969,
    "category": "meal-deals",
    "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 50,
    "name": "Meal Deal 03",
    "description": "1 Zooper Beef Burger + Medium Fries + 345ml Drink.",
    "price": 999,
    "category": "meal-deals",
    "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 51,
    "name": "Wow Deal 01",
    "description": "5 Ba Zinga Burgers + 1.5L Drink — party-ready.",
    "price": 2899,
    "category": "wow-deals",
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 52,
    "name": "Wow Deal 02",
    "description": "3 Pcs Fried Chicken + 345ml Drink.",
    "price": 999,
    "category": "wow-deals",
    "image": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 53,
    "name": "Wow Deal 03",
    "description": "1 Small Pizza + 345ml Drink.",
    "price": 839,
    "category": "wow-deals",
    "image": "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 54,
    "name": "Wow Deal 04",
    "description": "1 Medium Pizza + 1L Drink.",
    "price": 1279,
    "category": "wow-deals",
    "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 55,
    "name": "Wow Deal 05",
    "description": "1 Large Pizza + 1.5L Drink.",
    "price": 1779,
    "category": "wow-deals",
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 56,
    "name": "Family Deal 01",
    "description": "2 Medium Pizzas + 4 Ba Zinga + 10 Fried Wings + 2 Large Fries + 1.5L Drink.",
    "price": 6199,
    "category": "family-deals",
    "image": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 57,
    "name": "Family Deal 02",
    "description": "4 Ba Zinga Burgers + 10 Fried Wings + 2 Large Fries + 1.5L Drink.",
    "price": 3999,
    "category": "family-deals",
    "image": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 58,
    "name": "Family Deal 03",
    "description": "2 Large Pizzas + 1.5L Drink.",
    "price": 3399,
    "category": "family-deals",
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 59,
    "name": "Family Deal 04",
    "description": "2 Medium Pizzas + 1.5L Drink.",
    "price": 2449,
    "category": "family-deals",
    "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 60,
    "name": "Family Deal 05",
    "description": "2 Small Pizzas + 2 Ba Zinga Burgers + 1 Large Fries + 1.5L Drink.",
    "price": 3199,
    "category": "family-deals",
    "image": "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 61,
    "name": "Party Deal",
    "description": "2 Large Pizzas + 3 Ba Zinga + 3 Jack's Burgers + 2 Large Fries + 1 Behari Roll + 1 Arabic Roll + 10 Grilled Wings + 10 Nuggets + 1.5L Drink.",
    "price": 10199,
    "category": "party-kids",
    "image": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 62,
    "name": "Kids Deal",
    "description": "1 Crispo Burger + 3 Nuggets + Medium Fries + 345ml Drink.",
    "price": 1099,
    "category": "party-kids",
    "image": "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 63,
    "name": "Welcome Deal 1",
    "description": "Medium Crown Pizza + Krunchy Pasta + 2 Classic Mojitos.",
    "price": 2799,
    "category": "welcome-deals",
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 64,
    "name": "Welcome Deal 2",
    "description": "3 Ba Zinga Burgers + 3 Margaritas.",
    "price": 2429,
    "category": "welcome-deals",
    "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 65,
    "name": "Welcome Deal 3",
    "description": "1 Calzone + 5 Pcs Nuggets + 2 Passion Fruit Mojitos.",
    "price": 1999,
    "category": "welcome-deals",
    "image": "https://images.unsplash.com/photo-1753656681797-3234c89d6d4d?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 66,
    "name": "Welcome Deal 4",
    "description": "Large Crown Pizza + 5 Pcs Fried Wings + 1L Cold Drink.",
    "price": 2359,
    "category": "welcome-deals",
    "image": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 67,
    "name": "Welcome Deal 5",
    "description": "Chicken Chowmein + Chicken Chilli Dry with Rice + 2 Passion Fruit Mojitos.",
    "price": 2429,
    "category": "welcome-deals",
    "image": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 68,
    "name": "Welcome Deal 6",
    "description": "Loaded Fries + Rock Star Burger + Iced Tea.",
    "price": 1529,
    "category": "welcome-deals",
    "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 69,
    "name": "Grill Out Special Soup",
    "description": "Our house-signature soup, rich and full-bodied.",
    "price": 549,
    "category": "soups",
    "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "options": [
      {
        "label": "Single",
        "price": 549
      },
      {
        "label": "Family",
        "price": 1399
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 70,
    "name": "Chicken Corn Soup",
    "description": "Classic shredded chicken & sweet corn broth.",
    "price": 399,
    "category": "soups",
    "image": "https://images.unsplash.com/photo-1781332152789-2165582fddb6?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Single",
        "price": 399
      },
      {
        "label": "Family",
        "price": 1049
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 71,
    "name": "Hot n Sour Soup",
    "description": "Tangy, peppery broth with a warming chilli kick.",
    "price": 399,
    "category": "soups",
    "image": "https://images.unsplash.com/photo-1527976746453-f363eac4d889?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "options": [
      {
        "label": "Single",
        "price": 399
      },
      {
        "label": "Family",
        "price": 1049
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 72,
    "name": "Thai Soup",
    "description": "Fragrant Thai-style broth loaded with fresh herbs.",
    "price": 399,
    "category": "soups",
    "image": "https://images.unsplash.com/photo-1761037994516-502ed10932b0?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Single",
        "price": 399
      },
      {
        "label": "Family",
        "price": 1049
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 73,
    "name": "Fried Wings",
    "description": "Classic golden-fried chicken wings.",
    "price": 499,
    "category": "wings",
    "image": "https://images.unsplash.com/photo-1637273484026-11d51fb64024?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "5 Pcs",
        "price": 499
      },
      {
        "label": "10 Pcs",
        "price": 899
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 74,
    "name": "Honey Wings",
    "description": "Crispy wings glazed in sweet honey sauce.",
    "price": 549,
    "category": "wings",
    "image": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "5 Pcs",
        "price": 549
      },
      {
        "label": "10 Pcs",
        "price": 999
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 75,
    "name": "Grilled Wings",
    "description": "Char-grilled wings, smoky and lightly spiced.",
    "price": 449,
    "category": "wings",
    "image": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "5 Pcs",
        "price": 449
      },
      {
        "label": "10 Pcs",
        "price": 799
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 76,
    "name": "Peri Peri Wings",
    "description": "Fiery peri peri glaze over crispy wings.",
    "price": 499,
    "category": "wings",
    "image": "https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "options": [
      {
        "label": "5 Pcs",
        "price": 499
      },
      {
        "label": "10 Pcs",
        "price": 899
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 77,
    "name": "BBQ Wings",
    "description": "Smoky BBQ-glazed wings, grilled to a sticky finish.",
    "price": 499,
    "category": "wings",
    "image": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "options": [
      {
        "label": "5 Pcs",
        "price": 499
      },
      {
        "label": "10 Pcs",
        "price": 849
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 78,
    "name": "Chicken Chilli Dry with Rice",
    "description": "Wok-tossed chicken in a bold chilli-garlic glaze, served with rice.",
    "price": 999,
    "category": "thai-chinese",
    "image": "https://images.unsplash.com/photo-1624726175512-19b9baf9fbd1?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 79,
    "name": "Beef Chilli Dry with Rice",
    "description": "Tender beef strips in a fiery dry chilli sauce, served with rice.",
    "price": 1299,
    "category": "thai-chinese",
    "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [
      "spicy"
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 80,
    "name": "Chicken Manchurian with Rice",
    "description": "Deep-fried chicken tossed in tangy Indo-Chinese Manchurian sauce.",
    "price": 949,
    "category": "thai-chinese",
    "image": "https://images.unsplash.com/photo-1682622110433-65513a55d7da?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 81,
    "name": "Oyster Chicken with Rice",
    "description": "Chicken stir-fried in rich oyster sauce with vegetables.",
    "price": 949,
    "category": "thai-chinese",
    "image": "https://images.unsplash.com/photo-1609183480237-ccbb2d7c5772?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 82,
    "name": "Chicken Chowmein",
    "description": "Stir-fried noodles with chicken & crisp vegetables.",
    "price": 899,
    "category": "thai-chinese",
    "image": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 83,
    "name": "Vegetable Masala Rice",
    "description": "Fragrant spiced rice tossed with fresh vegetables.",
    "price": 349,
    "category": "thai-chinese",
    "image": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 84,
    "name": "Chicken Egg Fried Rice",
    "description": "Classic egg fried rice with tender chicken pieces.",
    "price": 499,
    "category": "thai-chinese",
    "image": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 85,
    "name": "Hot Coffees",
    "description": "Freshly brewed espresso-based hot coffees.",
    "price": 250,
    "category": "hot-station",
    "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Cappuccino",
        "price": 499
      },
      {
        "label": "Café Latte",
        "price": 499
      },
      {
        "label": "Black Coffee",
        "price": 250
      },
      {
        "label": "Espresso Shot",
        "price": 250
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 86,
    "name": "Flavored Coffee",
    "description": "Signature flavored coffees & hot chocolate.",
    "price": 499,
    "category": "hot-station",
    "image": "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Vanilla Latte",
        "price": 549
      },
      {
        "label": "Caramel Latte",
        "price": 549
      },
      {
        "label": "Hot Chocolate",
        "price": 499
      },
      {
        "label": "Café Mocha",
        "price": 499
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 87,
    "name": "Tea Selection",
    "description": "A warm pot of your choice, steeped fresh.",
    "price": 99,
    "category": "hot-station",
    "image": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Mix Tea",
        "price": 149
      },
      {
        "label": "Cardamom Tea",
        "price": 169
      },
      {
        "label": "Green Tea",
        "price": 99
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 88,
    "name": "Mojitos",
    "description": "Fresh muddled mojitos, ice cold — pick your flavor.",
    "price": 399,
    "category": "cold-station",
    "image": "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Classic Mint",
        "price": 399
      },
      {
        "label": "Lemon",
        "price": 399
      },
      {
        "label": "Orange",
        "price": 399
      },
      {
        "label": "Strawberry",
        "price": 399
      },
      {
        "label": "Mango",
        "price": 399
      },
      {
        "label": "Blueberry",
        "price": 399
      },
      {
        "label": "Raspberry",
        "price": 399
      },
      {
        "label": "Peach",
        "price": 399
      },
      {
        "label": "Kiwi",
        "price": 399
      },
      {
        "label": "Passion Fruit",
        "price": 399
      },
      {
        "label": "Mint",
        "price": 399
      },
      {
        "label": "Electric",
        "price": 399
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 89,
    "name": "Margarettas",
    "description": "Zesty virgin margarettas in a range of fruity flavors.",
    "price": 299,
    "category": "cold-station",
    "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Mint",
        "price": 299
      },
      {
        "label": "Spanish",
        "price": 299
      },
      {
        "label": "Strawberry",
        "price": 299
      },
      {
        "label": "Blueberry",
        "price": 349
      },
      {
        "label": "Classic",
        "price": 349
      },
      {
        "label": "Peach",
        "price": 349
      },
      {
        "label": "Raspberry",
        "price": 349
      },
      {
        "label": "Passion Fruit",
        "price": 349
      },
      {
        "label": "Mango",
        "price": 349
      },
      {
        "label": "Kiwi",
        "price": 349
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 90,
    "name": "Lemonades & Sodas",
    "description": "Crisp, refreshing lemonades and fizzy sodas.",
    "price": 299,
    "category": "cold-station",
    "image": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Plain Lemonade",
        "price": 299
      },
      {
        "label": "Peach Shooter Soda",
        "price": 399
      },
      {
        "label": "Electric Lemonade",
        "price": 399
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 91,
    "name": "Sundaes",
    "description": "Layered ice cream sundaes & warm brownies.",
    "price": 399,
    "category": "desserts-shakes",
    "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": true,
    "tags": [],
    "options": [
      {
        "label": "Vanilla Fudge Brownie",
        "price": 499
      },
      {
        "label": "Chocolate Fudge Brownie",
        "price": 499
      },
      {
        "label": "Strawberry Fudge Brownie",
        "price": 499
      },
      {
        "label": "Hot Brownie w/ Syrup",
        "price": 399
      },
      {
        "label": "Hot Brownie w/ Ice Cream",
        "price": 499
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 92,
    "name": "Smoothies",
    "description": "Thick, fruity smoothies blended fresh to order.",
    "price": 549,
    "category": "desserts-shakes",
    "image": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Special",
        "price": 549
      },
      {
        "label": "Strawberry",
        "price": 549
      },
      {
        "label": "Mango",
        "price": 549
      },
      {
        "label": "Blueberry",
        "price": 549
      },
      {
        "label": "Peach",
        "price": 549
      },
      {
        "label": "Kiwi",
        "price": 599
      },
      {
        "label": "Passion Fruit",
        "price": 599
      },
      {
        "label": "Classic",
        "price": 549
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 93,
    "name": "Ice Cream Shakes",
    "description": "Thick, creamy shakes in every flavor imaginable.",
    "price": 499,
    "category": "desserts-shakes",
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "GrillOut Special",
        "price": 549
      },
      {
        "label": "Coconut",
        "price": 549
      },
      {
        "label": "Oreo",
        "price": 599
      },
      {
        "label": "Vanilla",
        "price": 549
      },
      {
        "label": "Kiwi",
        "price": 599
      },
      {
        "label": "Peach",
        "price": 599
      },
      {
        "label": "Blueberry",
        "price": 599
      },
      {
        "label": "Mango",
        "price": 549
      },
      {
        "label": "Strawberry",
        "price": 549
      },
      {
        "label": "Pinacolada",
        "price": 499
      },
      {
        "label": "Nutella",
        "price": 599
      },
      {
        "label": "Brownie",
        "price": 599
      },
      {
        "label": "KitKat",
        "price": 649
      },
      {
        "label": "Chocolate",
        "price": 549
      },
      {
        "label": "Caramel",
        "price": 649
      },
      {
        "label": "Passion Fruit",
        "price": 649
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 94,
    "name": "Bubble Milk Tea",
    "description": "Creamy milk tea with classic chewy tapioca pearls.",
    "price": 549,
    "category": "bubble-frappe",
    "image": "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Blueberry",
        "price": 549
      },
      {
        "label": "Strawberry",
        "price": 549
      },
      {
        "label": "Raspberry",
        "price": 549
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 95,
    "name": "Bubble Iced Tea",
    "description": "Fruity iced tea with tapioca pearls, served chilled.",
    "price": 449,
    "category": "bubble-frappe",
    "image": "https://images.unsplash.com/photo-1745883949374-baeba0ed57c3?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Blueberry",
        "price": 449
      },
      {
        "label": "Strawberry",
        "price": 449
      },
      {
        "label": "Raspberry",
        "price": 449
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 96,
    "name": "Iced Tea",
    "description": "Fruit-infused iced tea, light and refreshing.",
    "price": 349,
    "category": "bubble-frappe",
    "image": "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Blueberry",
        "price": 349
      },
      {
        "label": "Peach",
        "price": 349
      },
      {
        "label": "Strawberry",
        "price": 349
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 97,
    "name": "Frappecinnos",
    "description": "Blended iced coffee frappés, whipped to order.",
    "price": 699,
    "category": "bubble-frappe",
    "image": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Mocha",
        "price": 699
      },
      {
        "label": "Caramel",
        "price": 699
      },
      {
        "label": "Vanilla",
        "price": 699
      },
      {
        "label": "Strawberry",
        "price": 699
      },
      {
        "label": "Mango",
        "price": 699
      },
      {
        "label": "Blueberry",
        "price": 699
      },
      {
        "label": "Raspberry",
        "price": 699
      },
      {
        "label": "Oreo",
        "price": 699
      },
      {
        "label": "Nutella",
        "price": 699
      },
      {
        "label": "Classic",
        "price": 699
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 98,
    "name": "Ice Coffee & Latte",
    "description": "Smooth iced lattes, poured over ice.",
    "price": 399,
    "category": "bubble-frappe",
    "image": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "Iced Latte",
        "price": 399
      },
      {
        "label": "Caramel Iced Latte",
        "price": 549
      },
      {
        "label": "Vanilla Iced Latte",
        "price": 549
      },
      {
        "label": "Mocha Iced Latte",
        "price": 549
      },
      {
        "label": "Classic Iced Latte",
        "price": 599
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  },
  {
    "id": 99,
    "name": "Ice Cream",
    "description": "GrillOut Special, Vanilla, Strawberry, Mango, Coconut & Chocolate scoops.",
    "price": 149,
    "category": "bubble-frappe",
    "image": "https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=800&q=80",
    "available": true,
    "featured": false,
    "tags": [],
    "options": [
      {
        "label": "1 Scoop",
        "price": 149
      },
      {
        "label": "2 Scoops",
        "price": 299
      },
      {
        "label": "3 Scoops",
        "price": 1049
      }
    ],
    "createdAt": "2026-09-22T13:00:00.619Z",
    "updatedAt": "2026-09-22T13:00:00.619Z"
  }
];
