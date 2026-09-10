// ============================================================
// Grill Out — site interactivity (mobile nav, menu filter,
// cart drawer, reservation form). No frameworks, no build step.
// ============================================================

// ---- Image bank ---------------------------------------------------------
// Verified stock photography (Unsplash), one per dish type. Menu items
// reuse the closest matching type rather than needing a unique photo each,
// which is standard practice for large combo/deal-heavy menus.
const IMG = {
  pizzaSpecial: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
  pizzaFlatbread: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=800&q=80",
  pizzaMargherita: "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=800&q=80",
  pizzaPepperoni: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80",
  calzone: "https://images.unsplash.com/photo-1753656681797-3234c89d6d4d?auto=format&fit=crop&w=800&q=80",
  mozzSticks: "https://images.unsplash.com/photo-1778449665117-2c607bbc7415?auto=format&fit=crop&w=800&q=80",
  friesLoaded: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
  friesPlain: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80",
  nuggets: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=800&q=80",
  burgerClassic: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  burgerCombo: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
  burgerStack: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80",
  steakBeef: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=800&q=80",
  steakChicken: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
  pastaCreamy: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
  pastaRed: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80",
  lasagne: "https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=800&q=80",
  wrap: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80",
  broast: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
  wings: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80",
  mojito: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80",
  cocktails: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80",
  noodles: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
  soup: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
  ramen: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=800&q=80",
  stirFryRice: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
  friedRice: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
  hotCoffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
  flavoredCoffee: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80",
  tea: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
  lemonade: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80",
  sundae: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80",
  smoothie: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
  milkshake: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  bubbleTea: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80",
  bubbleTeaIced: "https://images.unsplash.com/photo-1745883949374-baeba0ed57c3?auto=format&fit=crop&w=800&q=80",
  icedTea: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=800&q=80",
  frappe: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
  icedLatte: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  iceCream: "https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=800&q=80",
};

// ---- Categories (drive both the filter pills and the section grouping) ---
const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "pizza-special", label: "Special Pizzas" },
  { key: "pizza-regular", label: "Regular Pizzas" },
  { key: "appetizers", label: "Appetizers" },
  { key: "burgers", label: "Burgers" },
  { key: "steaks", label: "Steaks" },
  { key: "pasta", label: "Pasta & More" },
  { key: "wraps", label: "Wraps & Special Fries" },
  { key: "broast", label: "Chicken Corner" },
  { key: "meal-deals", label: "Meal Deals" },
  { key: "wow-deals", label: "Wow Deals" },
  { key: "family-deals", label: "Family Deals" },
  { key: "party-kids", label: "Party & Kids Deals" },
  { key: "welcome-deals", label: "Welcome Deals" },
  { key: "soups", label: "Soups" },
  { key: "wings", label: "Wings" },
  { key: "thai-chinese", label: "Thai Chinese & Rice" },
  { key: "hot-station", label: "Hot Station" },
  { key: "cold-station", label: "Cold Station" },
  { key: "desserts-shakes", label: "Sundaes & Shakes" },
  { key: "bubble-frappe", label: "Bubble Tea & Frappé" },
];

// ---- Menu data ------------------------------------------------------------
// Single source of truth for the menu grid. Real dish names & prices (PKR)
// from the Grill Out (GT Road, Haripur) menu boards. Items with more than
// one price (sizes, chicken/beef, piece counts) use `options` instead of
// a flat `price` — each option renders as its own add-to-cart pill.
const MENU_ITEMS = [
  // 1. Special Pizza Flavors
  { id: 1, name: "Crown Crust Pizza", category: "pizza-special",
    desc: "Cheese-stuffed crown crust with special chicken, capsicum, onion & olives in creamy white sauce.",
    img: IMG.pizzaSpecial, badge: "chef",
    options: [{ label: "M", price: 1399 }, { label: "L", price: 1949 }] },
  { id: 2, name: "Square Pizza", category: "pizza-special",
    desc: "Special chicken, capsicum, onion & olives on a crisp square crust with white sauce.",
    img: IMG.pizzaFlatbread,
    options: [{ label: "S", price: 849 }, { label: "M", price: 1399 }, { label: "L", price: 1949 }] },
  { id: 3, name: "Stuffed Crust Pizza", category: "pizza-special",
    desc: "Special chicken, seekh kabab, capsicum, onion, mushroom & olives, stuffed crust, white sauce.",
    img: IMG.pizzaPepperoni, badge: "chef",
    options: [{ label: "M", price: 1449 }, { label: "L", price: 2049 }] },
  { id: 4, name: "Shahi Mughlai", category: "pizza-special",
    desc: "Mughlai chicken, onion & capsicum finished with our special white sauce.",
    img: IMG.pizzaMargherita,
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },

  // 2. Regular Pizza Flavors
  { id: 5, name: "Grill Out Special", category: "pizza-regular",
    desc: "Our house-signature pizza loaded with a generous mix of toppings.",
    img: IMG.pizzaSpecial, badge: "chef",
    options: [{ label: "S", price: 849 }, { label: "M", price: 1299 }, { label: "L", price: 1849 }] },
  { id: 6, name: "Seekh Kabab", category: "pizza-regular",
    desc: "Spiced seekh kabab, onion & capsicum topped with our special sauce.",
    img: IMG.pizzaFlatbread,
    options: [{ label: "S", price: 899 }, { label: "M", price: 1399 }, { label: "L", price: 1949 }] },
  { id: 7, name: "Karara Tikka Pizza", category: "pizza-regular",
    desc: "Special chicken, capsicum, onion & jalapeno with olives for a fiery kick.",
    img: IMG.pizzaPepperoni, badge: "spicy",
    options: [{ label: "M", price: 1249 }, { label: "L", price: 1749 }] },
  { id: 8, name: "Chicken Supreme", category: "pizza-regular",
    desc: "Chicken tikka, crushed kabab, capsicum & tomatoes on a loaded base.",
    img: IMG.pizzaMargherita,
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 9, name: "Chicken Tikka", category: "pizza-regular",
    desc: "Classic chicken tikka, onion & capsicum on a bed of melted cheese.",
    img: IMG.pizzaSpecial,
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 10, name: "Chicken Fajita", category: "pizza-regular",
    desc: "Fajita chicken, onion, capsicum, olives & tomatoes for a zesty bite.",
    img: IMG.pizzaFlatbread,
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 11, name: "Chicken Tandoori", category: "pizza-regular",
    desc: "Hot 'n' spicy tandoori chicken, capsicum, onion & jalapeno with chilli flakes.",
    img: IMG.pizzaPepperoni, badge: "spicy",
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 12, name: "Peri Peri Special", category: "pizza-regular",
    desc: "Peri peri chicken, capsicum, mushroom, onion & olives finished with peri peri sauce.",
    img: IMG.pizzaMargherita, badge: "spicy",
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 13, name: "Cheese Lover", category: "pizza-regular",
    desc: "Our special pizza sauce topped with cheese, and a bit more cheese.",
    img: IMG.pizzaSpecial, badge: "chef",
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 14, name: "Hot n Spicy", category: "pizza-regular",
    desc: "Spicy fajita chicken, jalapeno, onion, capsicum & chilli flakes.",
    img: IMG.pizzaFlatbread, badge: "spicy",
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 15, name: "Grill Out Special Platter", category: "pizza-regular",
    desc: "A hearty mixed platter fresh off the grill — great for sharing.",
    img: IMG.broast, badge: "chef", price: 1299 },
  { id: 16, name: "Calzone", category: "pizza-regular",
    desc: "Folded pizza dough stuffed with melted cheese & filling, baked golden.",
    img: IMG.calzone, price: 999 },
  { id: 17, name: "Cheezy Sticks", category: "pizza-regular",
    desc: "Golden breaded sticks with a molten mozzarella pull.",
    img: IMG.mozzSticks, price: 699 },

  // 3. Appetizers
  { id: 18, name: "Plain Fries", category: "appetizers",
    desc: "Classic crispy golden fries, lightly salted.",
    img: IMG.friesPlain, options: [{ label: "M", price: 399 }, { label: "L", price: 449 }] },
  { id: 19, name: "Mayo Fries", category: "appetizers",
    desc: "Crispy fries tossed in creamy house-made mayo.",
    img: IMG.friesLoaded, options: [{ label: "M", price: 449 }, { label: "L", price: 549 }] },
  { id: 20, name: "Nuggets", category: "appetizers",
    desc: "Golden breaded chicken nuggets, crispy on the outside, juicy within.",
    img: IMG.nuggets, options: [{ label: "5 Pcs", price: 449 }, { label: "10 Pcs", price: 799 }] },

  // 4. Burgers
  { id: 21, name: "Ba Zinga", category: "burgers",
    desc: "Crispy fried chicken fillet, melted cheese & our signature peri peri sauce.",
    img: IMG.burgerClassic, badge: "chef", price: 599 },
  { id: 22, name: "Jack's Grilled Burger", category: "burgers",
    desc: "Flame-grilled chicken breast, fresh lettuce, tomato & smoky mayo.",
    img: IMG.burgerCombo, price: 599 },
  { id: 23, name: "Flammer", category: "burgers",
    desc: "Spiced beef patty stacked high with a fiery house sauce.",
    img: IMG.burgerStack, badge: "spicy", price: 649 },
  { id: 24, name: "Flango", category: "burgers",
    desc: "Grilled chicken layered with tangy mango-chilli glaze.",
    img: IMG.burgerClassic, price: 649 },
  { id: 25, name: "Rock Star Grilled Burger", category: "burgers",
    desc: "Char-grilled beef patty, melted cheese & crispy onions.",
    img: IMG.burgerCombo, badge: "chef", price: 699 },
  { id: 26, name: "Lava Burger", category: "burgers",
    desc: "Double beef patty smothered in melted cheese and a fiery lava sauce.",
    img: IMG.burgerStack, badge: "spicy", price: 699 },
  { id: 27, name: "Fillet o Fire", category: "burgers",
    desc: "Crispy fish fillet with a spicy tartare kick.",
    img: IMG.burgerClassic, badge: "spicy", price: 599 },
  { id: 28, name: "Crispo", category: "burgers",
    desc: "Crispy chicken fillet, lettuce & mayo on a toasted bun.",
    img: IMG.burgerCombo, price: 449 },
  { id: 29, name: "Beef Steak Burger", category: "burgers",
    desc: "Thick-cut beef steak patty with all the classic fixings.",
    img: IMG.burgerStack, price: 749 },
  { id: 30, name: "Zooper Beef", category: "burgers",
    desc: "Loaded double beef patty burger built for big appetites.",
    img: IMG.burgerClassic, price: 649 },

  // 5. Steaks (chicken / beef variants)
  { id: 31, name: "Mexican Grilled Steak", category: "steaks",
    desc: "Bold Mexican spice rub, chargrilled and served sizzling hot.",
    img: IMG.steakBeef, badge: "spicy",
    options: [{ label: "Chicken", price: 1699 }, { label: "Beef", price: 2299 }] },
  { id: 32, name: "Tarragon Grilled Steak", category: "steaks",
    desc: "Fresh tarragon herb marinade, grilled over an open flame.",
    img: IMG.steakChicken,
    options: [{ label: "Chicken", price: 1699 }, { label: "Beef", price: 2299 }] },
  { id: 33, name: "Mushroom Grilled Steak", category: "steaks",
    desc: "Finished with a rich mushroom sauce for an earthy, savory bite.",
    img: IMG.steakBeef,
    options: [{ label: "Chicken", price: 1699 }, { label: "Beef", price: 2299 }] },
  { id: 34, name: "Moroccan Grilled Steak", category: "steaks",
    desc: "Warm Moroccan spice blend, grilled low and slow for deep flavor.",
    img: IMG.steakChicken,
    options: [{ label: "Chicken", price: 1699 }, { label: "Beef", price: 2299 }] },
  { id: 35, name: "Smoky BBQ Grilled Steak", category: "steaks",
    desc: "Basted in a smoky BBQ glaze and seared to perfection.",
    img: IMG.steakBeef, badge: "chef",
    options: [{ label: "Chicken", price: 1699 }, { label: "Beef", price: 2299 }] },

  // 6. Pasta & Others
  { id: 36, name: "Krunchy Pasta", category: "pasta",
    desc: "Penne tossed in a bold red sauce with a crunchy topping.",
    img: IMG.pastaRed, badge: "spicy", price: 899 },
  { id: 37, name: "Flaming Pasta", category: "pasta",
    desc: "Fiery chilli-infused pasta for the heat-seekers.",
    img: IMG.pastaCreamy, badge: "spicy", price: 899 },
  { id: 38, name: "Alfredo Fresco", category: "pasta",
    desc: "Silky, creamy alfredo sauce tossed through fettuccine.",
    img: IMG.pastaCreamy, price: 999 },
  { id: 39, name: "Grill Out Special Lasagne", category: "pasta",
    desc: "Layers of pasta, rich meat sauce & melted cheese, oven-baked.",
    img: IMG.lasagne, badge: "chef", price: 949 },

  // 7. Wraps & Special Fries
  { id: 40, name: "Behari Roll", category: "wraps",
    desc: "Spiced behari beef rolled in a soft paratha wrap.",
    img: IMG.wrap, price: 699 },
  { id: 41, name: "Arabic Roll", category: "wraps",
    desc: "Grilled chicken, garlic sauce & pickles in a warm Arabic wrap.",
    img: IMG.wrap, price: 699 },
  { id: 42, name: "Fajita Wrap", category: "wraps",
    desc: "Grilled fajita chicken wrapped with crunchy slaw.",
    img: IMG.wrap, price: 449 },
  { id: 43, name: "Loaded Cheese Fries", category: "wraps",
    desc: "Golden fries loaded with melted cheese & house sauce.",
    img: IMG.friesLoaded, badge: "spicy", price: 649 },
  { id: 44, name: "Loaded Pizza Fries", category: "wraps",
    desc: "Fries topped with pizza sauce, mozzarella & toppings.",
    img: IMG.friesLoaded, price: 699 },
  { id: 45, name: "Chilli Cheese Fries", category: "wraps",
    desc: "Crispy fries smothered in chilli-cheese sauce.",
    img: IMG.friesLoaded, badge: "spicy", price: 549 },

  // 8. Chicken Corner & Broast
  { id: 46, name: "Arabic Broast", category: "broast",
    desc: "Crispy golden broasted chicken, marinated in our secret spice blend.",
    img: IMG.broast,
    options: [{ label: "1 Pc", price: 349 }, { label: "2 Pcs", price: 649 }, { label: "5 Pcs", price: 1599 }] },
  { id: 47, name: "Smoke & Grill Chicken", category: "broast",
    desc: "Smoke-grilled chicken piece served with dip, or as a full meal.",
    img: IMG.wings, badge: "chef",
    options: [{ label: "1 Pc + Dip", price: 399 }, { label: "1 Pc Meal", price: 499 }, { label: "2 Pcs Meal", price: 1049 }] },

  // 9. Meal Deals
  { id: 48, name: "Meal Deal 01", category: "meal-deals",
    desc: "1 Ba Zinga Burger + Medium Fries + 345ml Drink.",
    img: IMG.burgerCombo, price: 969 },
  { id: 49, name: "Meal Deal 02", category: "meal-deals",
    desc: "1 Jack's Grilled Burger + Medium Fries + 345ml Drink.",
    img: IMG.burgerCombo, price: 969 },
  { id: 50, name: "Meal Deal 03", category: "meal-deals",
    desc: "1 Zooper Beef Burger + Medium Fries + 345ml Drink.",
    img: IMG.burgerCombo, price: 999 },

  // 10. Wow Deals
  { id: 51, name: "Wow Deal 01", category: "wow-deals",
    desc: "5 Ba Zinga Burgers + 1.5L Drink — party-ready.",
    img: IMG.burgerClassic, price: 2899 },
  { id: 52, name: "Wow Deal 02", category: "wow-deals",
    desc: "3 Pcs Fried Chicken + 345ml Drink.",
    img: IMG.broast, price: 999 },
  { id: 53, name: "Wow Deal 03", category: "wow-deals",
    desc: "1 Small Pizza + 345ml Drink.",
    img: IMG.pizzaMargherita, price: 839 },
  { id: 54, name: "Wow Deal 04", category: "wow-deals",
    desc: "1 Medium Pizza + 1L Drink.",
    img: IMG.pizzaFlatbread, price: 1279 },
  { id: 55, name: "Wow Deal 05", category: "wow-deals",
    desc: "1 Large Pizza + 1.5L Drink.",
    img: IMG.pizzaSpecial, price: 1779 },

  // 11. Family Deals
  { id: 56, name: "Family Deal 01", category: "family-deals",
    desc: "2 Medium Pizzas + 4 Ba Zinga + 10 Fried Wings + 2 Large Fries + 1.5L Drink.",
    img: IMG.wings, badge: "chef", price: 6199 },
  { id: 57, name: "Family Deal 02", category: "family-deals",
    desc: "4 Ba Zinga Burgers + 10 Fried Wings + 2 Large Fries + 1.5L Drink.",
    img: IMG.wings, price: 3999 },
  { id: 58, name: "Family Deal 03", category: "family-deals",
    desc: "2 Large Pizzas + 1.5L Drink.",
    img: IMG.pizzaSpecial, price: 3399 },
  { id: 59, name: "Family Deal 04", category: "family-deals",
    desc: "2 Medium Pizzas + 1.5L Drink.",
    img: IMG.pizzaFlatbread, price: 2449 },
  { id: 60, name: "Family Deal 05", category: "family-deals",
    desc: "2 Small Pizzas + 2 Ba Zinga Burgers + 1 Large Fries + 1.5L Drink.",
    img: IMG.pizzaMargherita, price: 3199 },

  // 12. Party & Kids Deals
  { id: 61, name: "Party Deal", category: "party-kids",
    desc: "2 Large Pizzas + 3 Ba Zinga + 3 Jack's Burgers + 2 Large Fries + 1 Behari Roll + 1 Arabic Roll + 10 Grilled Wings + 10 Nuggets + 1.5L Drink.",
    img: IMG.wings, badge: "chef", price: 10199 },
  { id: 62, name: "Kids Deal", category: "party-kids",
    desc: "1 Crispo Burger + 3 Nuggets + Medium Fries + 345ml Drink.",
    img: IMG.nuggets, price: 1099 },

  // 13. Welcome Deals
  { id: 63, name: "Welcome Deal 1", category: "welcome-deals",
    desc: "Medium Crown Pizza + Krunchy Pasta + 2 Classic Mojitos.",
    img: IMG.pizzaSpecial, price: 2799 },
  { id: 64, name: "Welcome Deal 2", category: "welcome-deals",
    desc: "3 Ba Zinga Burgers + 3 Margaritas.",
    img: IMG.cocktails, price: 2429 },
  { id: 65, name: "Welcome Deal 3", category: "welcome-deals",
    desc: "1 Calzone + 5 Pcs Nuggets + 2 Passion Fruit Mojitos.",
    img: IMG.calzone, price: 1999 },
  { id: 66, name: "Welcome Deal 4", category: "welcome-deals",
    desc: "Large Crown Pizza + 5 Pcs Fried Wings + 1L Cold Drink.",
    img: IMG.wings, price: 2359 },
  { id: 67, name: "Welcome Deal 5", category: "welcome-deals",
    desc: "Chicken Chowmein + Chicken Chilli Dry with Rice + 2 Passion Fruit Mojitos.",
    img: IMG.noodles, price: 2429 },
  { id: 68, name: "Welcome Deal 6", category: "welcome-deals",
    desc: "Loaded Fries + Rock Star Burger + Iced Tea.",
    img: IMG.burgerCombo, price: 1529 },

  // 14. Soups
  { id: 69, name: "Grill Out Special Soup", category: "soups",
    desc: "Our house-signature soup, rich and full-bodied.",
    img: IMG.soup, badge: "chef",
    options: [{ label: "Single", price: 549 }, { label: "Family", price: 1399 }] },
  { id: 70, name: "Chicken Corn Soup", category: "soups",
    desc: "Classic shredded chicken & sweet corn broth.",
    img: IMG.soup,
    options: [{ label: "Single", price: 399 }, { label: "Family", price: 1049 }] },
  { id: 71, name: "Hot n Sour Soup", category: "soups",
    desc: "Tangy, peppery broth with a warming chilli kick.",
    img: IMG.soup, badge: "spicy",
    options: [{ label: "Single", price: 399 }, { label: "Family", price: 1049 }] },
  { id: 72, name: "Thai Soup", category: "soups",
    desc: "Fragrant Thai-style broth loaded with fresh herbs.",
    img: IMG.ramen,
    options: [{ label: "Single", price: 399 }, { label: "Family", price: 1049 }] },

  // 15. Wings
  { id: 73, name: "Fried Wings", category: "wings",
    desc: "Classic golden-fried chicken wings.",
    img: IMG.wings, options: [{ label: "5 Pcs", price: 499 }, { label: "10 Pcs", price: 899 }] },
  { id: 74, name: "Honey Wings", category: "wings",
    desc: "Crispy wings glazed in sweet honey sauce.",
    img: IMG.wings, options: [{ label: "5 Pcs", price: 549 }, { label: "10 Pcs", price: 999 }] },
  { id: 75, name: "Grilled Wings", category: "wings",
    desc: "Char-grilled wings, smoky and lightly spiced.",
    img: IMG.wings, options: [{ label: "5 Pcs", price: 449 }, { label: "10 Pcs", price: 799 }] },
  { id: 76, name: "Peri Peri Wings", category: "wings",
    desc: "Fiery peri peri glaze over crispy wings.",
    img: IMG.wings, badge: "spicy",
    options: [{ label: "5 Pcs", price: 499 }, { label: "10 Pcs", price: 899 }] },
  { id: 77, name: "BBQ Wings", category: "wings",
    desc: "Smoky BBQ-glazed wings, grilled to a sticky finish.",
    img: IMG.wings, badge: "chef",
    options: [{ label: "5 Pcs", price: 499 }, { label: "10 Pcs", price: 849 }] },

  // 16. Thai Chinese & Noodles / Rice
  { id: 78, name: "Chicken Chilli Dry with Rice", category: "thai-chinese",
    desc: "Wok-tossed chicken in a bold chilli-garlic glaze, served with rice.",
    img: IMG.stirFryRice, badge: "spicy", price: 999 },
  { id: 79, name: "Beef Chilli Dry with Rice", category: "thai-chinese",
    desc: "Tender beef strips in a fiery dry chilli sauce, served with rice.",
    img: IMG.stirFryRice, badge: "spicy", price: 1299 },
  { id: 80, name: "Chicken Manchurian with Rice", category: "thai-chinese",
    desc: "Deep-fried chicken tossed in tangy Indo-Chinese Manchurian sauce.",
    img: IMG.stirFryRice, price: 949 },
  { id: 81, name: "Oyster Chicken with Rice", category: "thai-chinese",
    desc: "Chicken stir-fried in rich oyster sauce with vegetables.",
    img: IMG.friedRice, price: 949 },
  { id: 82, name: "Chicken Chowmein", category: "thai-chinese",
    desc: "Stir-fried noodles with chicken & crisp vegetables.",
    img: IMG.noodles, price: 899 },
  { id: 83, name: "Vegetable Masala Rice", category: "thai-chinese",
    desc: "Fragrant spiced rice tossed with fresh vegetables.",
    img: IMG.friedRice, price: 349 },
  { id: 84, name: "Chicken Egg Fried Rice", category: "thai-chinese",
    desc: "Classic egg fried rice with tender chicken pieces.",
    img: IMG.friedRice, price: 499 },

  // 17. Hot Station
  { id: 85, name: "Hot Coffees", category: "hot-station",
    desc: "Freshly brewed espresso-based hot coffees.",
    img: IMG.hotCoffee,
    options: [
      { label: "Cappuccino", price: 499 }, { label: "Café Latte", price: 499 },
      { label: "Black Coffee", price: 250 }, { label: "Espresso Shot", price: 250 },
    ] },
  { id: 86, name: "Flavored Coffee", category: "hot-station",
    desc: "Signature flavored coffees & hot chocolate.",
    img: IMG.flavoredCoffee,
    options: [
      { label: "Vanilla Latte", price: 549 }, { label: "Caramel Latte", price: 549 },
      { label: "Hot Chocolate", price: 499 }, { label: "Café Mocha", price: 499 },
    ] },
  { id: 87, name: "Tea Selection", category: "hot-station",
    desc: "A warm pot of your choice, steeped fresh.",
    img: IMG.tea,
    options: [
      { label: "Mix Tea", price: 149 }, { label: "Cardamom Tea", price: 169 }, { label: "Green Tea", price: 99 },
    ] },

  // 18. Cold Station
  { id: 88, name: "Mojitos", category: "cold-station",
    desc: "Fresh muddled mojitos, ice cold — pick your flavor.",
    img: IMG.mojito,
    options: [
      "Classic Mint", "Lemon", "Orange", "Strawberry", "Mango", "Blueberry",
      "Raspberry", "Peach", "Kiwi", "Passion Fruit", "Mint", "Electric",
    ].map((label) => ({ label, price: 399 })) },
  { id: 89, name: "Margarettas", category: "cold-station",
    desc: "Zesty virgin margarettas in a range of fruity flavors.",
    img: IMG.cocktails,
    options: [
      { label: "Mint", price: 299 }, { label: "Spanish", price: 299 }, { label: "Strawberry", price: 299 },
      { label: "Blueberry", price: 349 }, { label: "Classic", price: 349 }, { label: "Peach", price: 349 },
      { label: "Raspberry", price: 349 }, { label: "Passion Fruit", price: 349 },
      { label: "Mango", price: 349 }, { label: "Kiwi", price: 349 },
    ] },
  { id: 90, name: "Lemonades & Sodas", category: "cold-station",
    desc: "Crisp, refreshing lemonades and fizzy sodas.",
    img: IMG.lemonade,
    options: [
      { label: "Plain Lemonade", price: 299 }, { label: "Peach Shooter Soda", price: 399 },
      { label: "Electric Lemonade", price: 399 },
    ] },

  // 19. Sundaes, Smoothies & Shakes
  { id: 91, name: "Sundaes", category: "desserts-shakes",
    desc: "Layered ice cream sundaes & warm brownies.",
    img: IMG.sundae, badge: "chef",
    options: [
      { label: "Vanilla Fudge Brownie", price: 499 }, { label: "Chocolate Fudge Brownie", price: 499 },
      { label: "Strawberry Fudge Brownie", price: 499 }, { label: "Hot Brownie w/ Syrup", price: 399 },
      { label: "Hot Brownie w/ Ice Cream", price: 499 },
    ] },
  { id: 92, name: "Smoothies", category: "desserts-shakes",
    desc: "Thick, fruity smoothies blended fresh to order.",
    img: IMG.smoothie,
    options: [
      { label: "Special", price: 549 }, { label: "Strawberry", price: 549 }, { label: "Mango", price: 549 },
      { label: "Blueberry", price: 549 }, { label: "Peach", price: 549 }, { label: "Kiwi", price: 599 },
      { label: "Passion Fruit", price: 599 }, { label: "Classic", price: 549 },
    ] },
  { id: 93, name: "Ice Cream Shakes", category: "desserts-shakes",
    desc: "Thick, creamy shakes in every flavor imaginable.",
    img: IMG.milkshake,
    options: [
      { label: "GrillOut Special", price: 549 }, { label: "Coconut", price: 549 }, { label: "Oreo", price: 599 },
      { label: "Vanilla", price: 549 }, { label: "Kiwi", price: 599 }, { label: "Peach", price: 599 },
      { label: "Blueberry", price: 599 }, { label: "Mango", price: 549 }, { label: "Strawberry", price: 549 },
      { label: "Pinacolada", price: 499 }, { label: "Nutella", price: 599 }, { label: "Brownie", price: 599 },
      { label: "KitKat", price: 649 }, { label: "Chocolate", price: 549 }, { label: "Caramel", price: 649 },
      { label: "Passion Fruit", price: 649 },
    ] },

  // 20. Bubble Tea & Frappé
  { id: 94, name: "Bubble Milk Tea", category: "bubble-frappe",
    desc: "Creamy milk tea with classic chewy tapioca pearls.",
    img: IMG.bubbleTea,
    options: [{ label: "Blueberry", price: 549 }, { label: "Strawberry", price: 549 }, { label: "Raspberry", price: 549 }] },
  { id: 95, name: "Bubble Iced Tea", category: "bubble-frappe",
    desc: "Fruity iced tea with tapioca pearls, served chilled.",
    img: IMG.bubbleTeaIced,
    options: [{ label: "Blueberry", price: 449 }, { label: "Strawberry", price: 449 }, { label: "Raspberry", price: 449 }] },
  { id: 96, name: "Iced Tea", category: "bubble-frappe",
    desc: "Fruit-infused iced tea, light and refreshing.",
    img: IMG.icedTea,
    options: [{ label: "Blueberry", price: 349 }, { label: "Peach", price: 349 }, { label: "Strawberry", price: 349 }] },
  { id: 97, name: "Frappecinnos", category: "bubble-frappe",
    desc: "Blended iced coffee frappés, whipped to order.",
    img: IMG.frappe,
    options: [
      { label: "Mocha", price: 699 }, { label: "Caramel", price: 699 }, { label: "Vanilla", price: 699 },
      { label: "Strawberry", price: 699 }, { label: "Mango", price: 699 }, { label: "Blueberry", price: 699 },
      { label: "Raspberry", price: 699 }, { label: "Oreo", price: 699 }, { label: "Nutella", price: 699 },
      { label: "Classic", price: 699 },
    ] },
  { id: 98, name: "Ice Coffee & Latte", category: "bubble-frappe",
    desc: "Smooth iced lattes, poured over ice.",
    img: IMG.icedLatte,
    options: [
      { label: "Iced Latte", price: 399 }, { label: "Caramel Iced Latte", price: 549 },
      { label: "Vanilla Iced Latte", price: 549 }, { label: "Mocha Iced Latte", price: 549 },
      { label: "Classic Iced Latte", price: 599 },
    ] },
  { id: 99, name: "Ice Cream", category: "bubble-frappe",
    desc: "GrillOut Special, Vanilla, Strawberry, Mango, Coconut & Chocolate scoops.",
    img: IMG.iceCream,
    options: [{ label: "1 Scoop", price: 149 }, { label: "2 Scoops", price: 299 }, { label: "3 Scoops", price: 1049 }] },
];

const BADGES = {
  chef: { label: "Chef's Special", classes: "bg-amber-500 text-black" },
  spicy: { label: "🌶 Spicy", classes: "bg-red-600 text-white" },
};

const formatPrice = (rupees) => `Rs. ${rupees.toLocaleString("en-PK")}`;

// ---- Cart state ---------------------------------------------------------
// Keyed by "<itemId>::<optionLabel|default>" so pizza sizes / steak
// variants / broast piece-counts are tracked as distinct cart lines.
// { [cartKey]: { id, option, qty } }
const cart = {};

const cartKey = (id, option) => `${id}::${option || "default"}`;

function priceFor(item, optionLabel) {
  if (item.options) {
    return item.options.find((o) => o.label === optionLabel)?.price ?? 0;
  }
  return item.price;
}

function cartCount() {
  return Object.values(cart).reduce((sum, line) => sum + line.qty, 0);
}

function cartTotal() {
  return Object.values(cart).reduce((sum, line) => {
    const item = MENU_ITEMS.find((m) => m.id === line.id);
    return sum + (item ? priceFor(item, line.option) * line.qty : 0);
  }, 0);
}

// ---- Filter tabs (generated from CATEGORIES) -------------------------------
const filterTabsEl = document.getElementById("filter-tabs");
filterTabsEl.innerHTML = CATEGORIES.map(
  (c, i) => `
  <button type="button" data-filter="${c.key}"
    class="rounded-full border px-5 py-2 text-sm font-semibold transition
      ${i === 0 ? "border-orange-600 bg-orange-600 text-white" : "border-white/10 text-gray-400 hover:border-flame hover:text-flame"}">
    ${c.label}
  </button>`
).join("");

// ---- Menu rendering ------------------------------------------------------
const menuGrid = document.getElementById("menu-grid");

function optionButtonsHtml(item) {
  return `
    <div class="mt-4 flex flex-wrap gap-2">
      ${item.options
        .map(
          (opt) => `
        <button type="button" data-add-to-cart="${item.id}" data-option="${opt.label}"
          class="add-to-cart-btn rounded-full border border-orange-600/50 bg-orange-600/10 px-3 py-1.5 text-xs font-semibold text-orange-400
            transition hover:bg-orange-600 hover:text-white active:scale-95">
          ${opt.label} <span class="opacity-80">· ${formatPrice(opt.price)}</span>
        </button>`
        )
        .join("")}
    </div>`;
}

function singlePriceButtonHtml(item) {
  return `
    <button type="button" data-add-to-cart="${item.id}"
      class="add-to-cart-btn mt-4 flex items-center justify-center gap-2 rounded-full
        bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition
        hover:bg-orange-500 active:scale-95">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <span data-cart-label="${item.id}">Add to Cart</span>
    </button>`;
}

function renderMenuCard(item) {
  const badge = item.badge ? BADGES[item.badge] : null;
  const priceBadge = item.price ? formatPrice(item.price) : null;

  return `
    <article class="menu-card group relative flex flex-col overflow-hidden rounded-2xl
        border border-white/5 bg-[#1a1a1a] transition-[border-color,box-shadow] duration-300
        hover:border-orange-500/40 hover:shadow-[0_10px_40px_-10px_rgba(255,107,0,0.35)]"
        data-category="${item.category}"
        data-tilt data-tilt-max="6" data-tilt-speed="500" data-tilt-glare data-tilt-max-glare="0.12" data-tilt-scale="1.015">
      <div class="relative overflow-hidden">
        <img src="${item.img}" alt="${item.name}" loading="lazy"
          onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'h-52 w-full flex items-center justify-center text-6xl bg-gradient-to-br from-[#2a1a10] via-[#331505] to-[#1a1010]',textContent:'🍽️'}))"
          class="h-52 w-full object-cover transition duration-500 group-hover:scale-110" />
        ${badge ? `<span class="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${badge.classes} shadow">${badge.label}</span>` : ""}
        ${priceBadge ? `<span class="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-sm font-bold text-orange-400 backdrop-blur">${priceBadge}</span>` : ""}
      </div>
      <div class="flex flex-1 flex-col p-5">
        <h3 class="font-display text-2xl tracking-wide text-white">${item.name}</h3>
        <p class="mt-2 flex-1 text-sm leading-relaxed text-gray-400">${item.desc}</p>
        ${item.options ? optionButtonsHtml(item) : singlePriceButtonHtml(item)}
      </div>
    </article>`;
}

function renderMenu() {
  menuGrid.innerHTML = MENU_ITEMS.map(renderMenuCard).join("");
}

// ---- Category filter -----------------------------------------------------
function applyFilter(category) {
  document.querySelectorAll(".menu-card").forEach((card) => {
    const show = category === "all" || card.dataset.category === category;
    card.classList.toggle("hidden", !show);
  });

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    const active = btn.dataset.filter === category;
    btn.classList.toggle("bg-orange-600", active);
    btn.classList.toggle("text-white", active);
    btn.classList.toggle("border-orange-600", active);
    btn.classList.toggle("border-white/10", !active);
    btn.classList.toggle("text-gray-400", !active);
  });
}

filterTabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  applyFilter(btn.dataset.filter);
});

// ---- Cart drawer -----------------------------------------------------------
const cartDrawer = document.getElementById("cart-drawer");
const cartBackdrop = document.getElementById("cart-backdrop");
const cartItemsEl = document.getElementById("cart-items");
const cartEmptyEl = document.getElementById("cart-empty");
const cartTotalEl = document.getElementById("cart-total");
const cartCountBadges = document.querySelectorAll("[data-cart-count]");

function openCart() {
  cartDrawer.classList.add("open");
  cartBackdrop.classList.add("open");
  document.body.classList.add("overflow-hidden");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartBackdrop.classList.remove("open");
  document.body.classList.remove("overflow-hidden");
}

function renderCart() {
  const lines = Object.entries(cart).filter(([, line]) => line.qty > 0);

  cartEmptyEl.classList.toggle("hidden", lines.length > 0);
  cartItemsEl.classList.toggle("hidden", lines.length === 0);

  cartItemsEl.innerHTML = lines
    .map(([key, line]) => {
      const item = MENU_ITEMS.find((m) => m.id === line.id);
      const price = priceFor(item, line.option);
      const label = line.option && line.option !== "default" ? `${item.name} (${line.option})` : item.name;

      return `
        <li class="flex items-center gap-3 border-b border-white/5 py-4">
          <img src="${item.img}" alt="${item.name}" class="h-16 w-16 rounded-xl object-cover"
            onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'flex h-16 w-16 items-center justify-center rounded-xl bg-[#241611] text-2xl',textContent:'🍽️'}))" />
          <div class="flex-1">
            <p class="text-sm font-semibold text-white">${label}</p>
            <p class="text-xs text-orange-400">${formatPrice(price)}</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" data-qty="-1" data-key="${key}"
              class="qty-btn flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white hover:border-orange-500 hover:text-orange-500">−</button>
            <span class="w-5 text-center text-sm font-semibold text-white">${line.qty}</span>
            <button type="button" data-qty="1" data-key="${key}"
              class="qty-btn flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white hover:border-orange-500 hover:text-orange-500">+</button>
          </div>
        </li>`;
    })
    .join("");

  cartTotalEl.textContent = formatPrice(cartTotal());
  cartCountBadges.forEach((el) => {
    const count = cartCount();
    el.textContent = count;
    el.classList.toggle("hidden", count === 0);
  });
}

function addToCart(id, option, buttonEl) {
  const key = cartKey(id, option);
  cart[key] = cart[key] || { id, option: option || "default", qty: 0 };
  cart[key].qty += 1;
  renderCart();
  syncCardLabel(id);
  openCart();

  if (buttonEl) {
    buttonEl.classList.add("animate-pop");
    setTimeout(() => buttonEl.classList.remove("animate-pop"), 350);
  }
}

function changeQty(key, delta) {
  if (!cart[key]) return;
  cart[key].qty = Math.max(0, cart[key].qty + delta);
  const id = cart[key].id;
  if (cart[key].qty === 0) delete cart[key];
  renderCart();
  syncCardLabel(id);
}

// Keep a single-price item's "Add to Cart" button in sync with its quantity.
function syncCardLabel(id) {
  const label = document.querySelector(`[data-cart-label="${id}"]`);
  if (!label) return;
  const total = Object.values(cart)
    .filter((line) => line.id === id)
    .reduce((sum, line) => sum + line.qty, 0);
  label.textContent = total > 0 ? `In Cart (${total})` : "Add to Cart";
}

menuGrid.addEventListener("click", (e) => {
  const addBtn = e.target.closest("[data-add-to-cart]");
  if (!addBtn) return;
  addToCart(Number(addBtn.dataset.addToCart), addBtn.dataset.option, addBtn);
});

cartItemsEl.addEventListener("click", (e) => {
  const qtyBtn = e.target.closest("[data-qty]");
  if (!qtyBtn) return;
  changeQty(qtyBtn.dataset.key, Number(qtyBtn.dataset.qty));
});

document.querySelectorAll("[data-cart-open]").forEach((btn) => btn.addEventListener("click", openCart));
document.querySelectorAll("[data-cart-close]").forEach((btn) => btn.addEventListener("click", closeCart));
cartBackdrop.addEventListener("click", closeCart);

document.getElementById("checkout-btn").addEventListener("click", () => {
  if (cartCount() === 0) return;
  const checkoutLabel = document.getElementById("checkout-label");
  const originalText = checkoutLabel.textContent;
  checkoutLabel.textContent = "Order Placed! 🔥";
  setTimeout(() => {
    Object.keys(cart).forEach((key) => delete cart[key]);
    renderCart();
    MENU_ITEMS.forEach((item) => syncCardLabel(item.id));
    checkoutLabel.textContent = originalText;
    closeCart();
  }, 1600);
});

// ---- Mobile nav ------------------------------------------------------------
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
const hamburgerIcon = document.getElementById("hamburger-icon");
const closeIcon = document.getElementById("close-icon");

mobileMenuBtn.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.toggle("open-menu");
  mobileMenu.classList.toggle("max-h-0");
  mobileMenu.classList.toggle("max-h-[28rem]");
  hamburgerIcon.classList.toggle("hidden", isOpen);
  closeIcon.classList.toggle("hidden", !isOpen);
});

mobileMenu.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open-menu", "max-h-[28rem]");
    mobileMenu.classList.add("max-h-0");
    hamburgerIcon.classList.remove("hidden");
    closeIcon.classList.add("hidden");
  })
);

// ---- Sticky nav shadow on scroll -------------------------------------------
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("shadow-lg", window.scrollY > 20);
  navbar.classList.toggle("bg-[#121212]/95", window.scrollY > 20);
  navbar.classList.toggle("bg-[#121212]/70", window.scrollY <= 20);
});

// ---- Reservation form --------------------------------------------------------
const reservationForm = document.getElementById("reservation-form");
const reservationSuccess = document.getElementById("reservation-success");

reservationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  reservationForm.classList.add("hidden");
  reservationSuccess.classList.remove("hidden");
});

document.getElementById("reservation-reset").addEventListener("click", () => {
  reservationForm.reset();
  reservationForm.classList.remove("hidden");
  reservationSuccess.classList.add("hidden");
});

// ---- Hero: 3D parallax, ember/smoke particles, mouse tilt -------------------
// All of this is skipped for prefers-reduced-motion — the hero still works
// perfectly with the static background and flat copy.
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Coarse pointers (touch) skip parallax/mouse-tilt/drag-tilt entirely and get
// a lighter particle count — see the performance guidance this was built against.
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

const heroSection = document.getElementById("home");
const heroBgLayer = document.getElementById("hero-bg-layer");
const heroContent = document.getElementById("hero-content");
const heroParticles = document.getElementById("hero-particles");

function spawnHeroParticles() {
  const EMBER_COUNT = isCoarsePointer ? 8 : 16;
  const SMOKE_COUNT = isCoarsePointer ? 2 : 5;
  const frag = document.createDocumentFragment();

  for (let i = 0; i < EMBER_COUNT; i++) {
    const ember = document.createElement("span");
    ember.className = "ember";
    const size = 3 + Math.random() * 5;
    ember.style.left = `${Math.random() * 100}%`;
    ember.style.width = `${size}px`;
    ember.style.height = `${size}px`;
    ember.style.setProperty("--drift", `${(Math.random() - 0.5) * 160}px`);
    ember.style.animationDuration = `${5 + Math.random() * 5}s`;
    ember.style.animationDelay = `${Math.random() * 8}s`;
    frag.appendChild(ember);
  }

  for (let i = 0; i < SMOKE_COUNT; i++) {
    const smoke = document.createElement("span");
    smoke.className = "smoke-puff";
    const size = 60 + Math.random() * 90;
    smoke.style.left = `${10 + Math.random() * 80}%`;
    smoke.style.width = `${size}px`;
    smoke.style.height = `${size}px`;
    smoke.style.setProperty("--drift", `${(Math.random() - 0.5) * 220}px`);
    smoke.style.animationDuration = `${10 + Math.random() * 6}s`;
    smoke.style.animationDelay = `${Math.random() * 10}s`;
    frag.appendChild(smoke);
  }

  heroParticles.appendChild(frag);
}

// Scroll parallax: the background photo drifts slower than the page,
// giving the hero real depth. rAF-throttled and paused once the hero
// scrolls out of view so it costs nothing on the rest of the page.
function initHeroParallax() {
  let ticking = false;

  function updateParallax() {
    const rect = heroSection.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      const progress = -rect.top / rect.height; // 0 at top of viewport, grows while scrolling through
      heroBgLayer.style.transform = `translate3d(0, ${progress * 60}px, 0) scale(1.08)`;
    }
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true }
  );
}

// Mouse tilt: the hero copy tilts very slightly toward the cursor,
// reinforcing the perspective set on the section in css/style.css.
function initHeroMouseTilt() {
  heroSection.addEventListener("mousemove", (e) => {
    const rect = heroSection.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    heroContent.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  });
  heroSection.addEventListener("mouseleave", () => {
    heroContent.style.transform = "rotateY(0deg) rotateX(0deg)";
  });
}

if (!prefersReducedMotion) {
  spawnHeroParticles();

  // Parallax, mouse-tilt and drag-based VanillaTilt are desktop-only —
  // on touch they either can't fire meaningfully or fight scrolling/tapping.
  if (!isCoarsePointer) {
    initHeroParallax();
    initHeroMouseTilt();
    if (window.VanillaTilt) {
      VanillaTilt.init(document.querySelectorAll("[data-tilt]"), { perspective: 900, glare: true });
    }
  }
}

// ---- Init --------------------------------------------------------------------
renderMenu();
applyFilter("all");
renderCart();

// Menu cards are injected after load, so their tilt needs its own init pass
// (desktop only — see the coarse-pointer note above).
if (!prefersReducedMotion && !isCoarsePointer && window.VanillaTilt) {
  VanillaTilt.init(document.querySelectorAll(".menu-card[data-tilt]"), { perspective: 900, glare: true });
}

// Minimum bookable date is today.
document.getElementById("reservation-date").min = new Date().toISOString().split("T")[0];
