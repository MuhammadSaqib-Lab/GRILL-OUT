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
  stirFryRice: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
  friedRice: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
  hotCoffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
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

  // Added in the full image audit — every entry below was downloaded and
  // visually checked against its name before being wired into MENU_ITEMS
  // (see the audit note above the array for what was wrong and why).
  pizzaLoaded: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
  pizzaWhole: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80",
  burgerFishCrispy: "https://images.unsplash.com/photo-1615297928064-24977384d0da?auto=format&fit=crop&w=800&q=80",
  burgerChickenCrispy: "https://images.unsplash.com/photo-1637710847214-f91d99669e18?auto=format&fit=crop&w=800&q=80",
  burgerChickenClean: "https://images.unsplash.com/photo-1692737349870-e3bfc704ebf9?auto=format&fit=crop&w=800&q=80",
  burgerBeefFlame: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=800&q=80",
  burgerGlazed: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?auto=format&fit=crop&w=800&q=80",
  burgerLoaded: "https://images.unsplash.com/photo-1549611016-3a70d82b5040?auto=format&fit=crop&w=800&q=80",
  burgerDoublePatty: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80",
  burgerKnife: "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=800&q=80",
  wrapBeefRoll: "https://images.unsplash.com/photo-1665469222949-3de88d37ee5a?auto=format&fit=crop&w=800&q=80",
  wrapShawarma: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80",
  friesChilliCheese: "https://images.unsplash.com/photo-1666304752980-678d5c35c911?auto=format&fit=crop&w=800&q=80",
  friesPizzaStyle: "https://images.unsplash.com/photo-1639744210631-209fce3e256c?auto=format&fit=crop&w=800&q=80",
  wingsGlazed: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80",
  wingsSaucyRed: "https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=800&q=80",
  wingsCrispyDry: "https://images.unsplash.com/photo-1637273484026-11d51fb64024?auto=format&fit=crop&w=800&q=80",
  soupCorn: "https://images.unsplash.com/photo-1781332152789-2165582fddb6?auto=format&fit=crop&w=800&q=80",
  soupHotSour: "https://images.unsplash.com/photo-1527976746453-f363eac4d889?auto=format&fit=crop&w=800&q=80",
  soupThai: "https://images.unsplash.com/photo-1761037994516-502ed10932b0?auto=format&fit=crop&w=800&q=80",
  pastaFiery: "https://images.unsplash.com/photo-1528738064262-9f834cbdfda1?auto=format&fit=crop&w=800&q=80",
  stirFryManchurian: "https://images.unsplash.com/photo-1682622110433-65513a55d7da?auto=format&fit=crop&w=800&q=80",
  stirFryOyster: "https://images.unsplash.com/photo-1609183480237-ccbb2d7c5772?auto=format&fit=crop&w=800&q=80",
  stirFryChilliRed: "https://images.unsplash.com/photo-1624726175512-19b9baf9fbd1?auto=format&fit=crop&w=800&q=80",
  latteHot: "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?auto=format&fit=crop&w=800&q=80",
  steakSliced: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80",
  steakStrips: "https://images.unsplash.com/photo-1633436375795-12b3b339712f?auto=format&fit=crop&w=800&q=80",
  steakRibeye: "https://images.unsplash.com/photo-1683315446874-e6a629087ef8?auto=format&fit=crop&w=800&q=80",
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
    img: IMG.pizzaMargherita, badge: "chef",
    options: [{ label: "M", price: 1449 }, { label: "L", price: 2049 }] },
  { id: 4, name: "Shahi Mughlai", category: "pizza-special",
    desc: "Mughlai chicken, onion & capsicum finished with our special white sauce.",
    img: IMG.pizzaPepperoni,
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },

  // 2. Regular Pizza Flavors
  { id: 5, name: "Grill Out Special", category: "pizza-regular",
    desc: "Our house-signature pizza loaded with a generous mix of toppings.",
    img: IMG.pizzaWhole, badge: "chef",
    options: [{ label: "S", price: 849 }, { label: "M", price: 1299 }, { label: "L", price: 1849 }] },
  { id: 6, name: "Seekh Kabab", category: "pizza-regular",
    desc: "Spiced seekh kabab, onion & capsicum topped with our special sauce.",
    img: IMG.pizzaLoaded,
    options: [{ label: "S", price: 899 }, { label: "M", price: 1399 }, { label: "L", price: 1949 }] },
  { id: 7, name: "Karara Tikka Pizza", category: "pizza-regular",
    desc: "Special chicken, capsicum, onion & jalapeno with olives for a fiery kick.",
    img: IMG.pizzaSpecial, badge: "spicy",
    options: [{ label: "M", price: 1249 }, { label: "L", price: 1749 }] },
  { id: 8, name: "Chicken Supreme", category: "pizza-regular",
    desc: "Chicken tikka, crushed kabab, capsicum & tomatoes on a loaded base.",
    img: IMG.pizzaFlatbread,
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 9, name: "Chicken Tikka", category: "pizza-regular",
    desc: "Classic chicken tikka, onion & capsicum on a bed of melted cheese.",
    img: IMG.pizzaMargherita,
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 10, name: "Chicken Fajita", category: "pizza-regular",
    desc: "Fajita chicken, onion, capsicum, olives & tomatoes for a zesty bite.",
    img: IMG.pizzaPepperoni,
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 11, name: "Chicken Tandoori", category: "pizza-regular",
    desc: "Hot 'n' spicy tandoori chicken, capsicum, onion & jalapeno with chilli flakes.",
    img: IMG.pizzaWhole, badge: "spicy",
    options: [{ label: "S", price: 849 }, { label: "M", price: 1249 }, { label: "L", price: 1799 }] },
  { id: 12, name: "Peri Peri Special", category: "pizza-regular",
    desc: "Peri peri chicken, capsicum, mushroom, onion & olives finished with peri peri sauce.",
    img: IMG.pizzaLoaded, badge: "spicy",
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
    img: IMG.friesPlain, options: [{ label: "M", price: 449 }, { label: "L", price: 549 }] },
  { id: 20, name: "Nuggets", category: "appetizers",
    desc: "Golden breaded chicken nuggets, crispy on the outside, juicy within.",
    img: IMG.nuggets, options: [{ label: "5 Pcs", price: 449 }, { label: "10 Pcs", price: 799 }] },

  // 4. Burgers
  { id: 21, name: "Ba Zinga", category: "burgers",
    desc: "Crispy fried chicken fillet, melted cheese & our signature peri peri sauce.",
    img: IMG.burgerChickenCrispy, badge: "chef", price: 599 },
  { id: 22, name: "Jack's Grilled Burger", category: "burgers",
    desc: "Flame-grilled chicken breast, fresh lettuce, tomato & smoky mayo.",
    img: IMG.burgerChickenClean, price: 599 },
  { id: 23, name: "Flammer", category: "burgers",
    desc: "Spiced beef patty stacked high with a fiery house sauce.",
    img: IMG.burgerBeefFlame, badge: "spicy", price: 649 },
  { id: 24, name: "Flango", category: "burgers",
    desc: "Grilled chicken layered with tangy mango-chilli glaze.",
    img: IMG.burgerGlazed, price: 649 },
  { id: 25, name: "Rock Star Grilled Burger", category: "burgers",
    desc: "Char-grilled beef patty, melted cheese & crispy onions.",
    img: IMG.burgerLoaded, badge: "chef", price: 699 },
  { id: 26, name: "Lava Burger", category: "burgers",
    desc: "Double beef patty smothered in melted cheese and a fiery lava sauce.",
    img: IMG.burgerDoublePatty, badge: "spicy", price: 699 },
  { id: 27, name: "Fillet o Fire", category: "burgers",
    desc: "Crispy fish fillet with a spicy tartare kick.",
    img: IMG.burgerFishCrispy, badge: "spicy", price: 599 },
  { id: 28, name: "Crispo", category: "burgers",
    desc: "Crispy chicken fillet, lettuce & mayo on a toasted bun.",
    img: IMG.burgerCombo, price: 449 },
  { id: 29, name: "Beef Steak Burger", category: "burgers",
    desc: "Thick-cut beef steak patty with all the classic fixings.",
    img: IMG.burgerKnife, price: 749 },
  { id: 30, name: "Zooper Beef", category: "burgers",
    desc: "Loaded double beef patty burger built for big appetites.",
    img: IMG.burgerStack, price: 649 },

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
    img: IMG.steakRibeye,
    options: [{ label: "Chicken", price: 1699 }, { label: "Beef", price: 2299 }] },
  { id: 34, name: "Moroccan Grilled Steak", category: "steaks",
    desc: "Warm Moroccan spice blend, grilled low and slow for deep flavor.",
    img: IMG.steakStrips,
    options: [{ label: "Chicken", price: 1699 }, { label: "Beef", price: 2299 }] },
  { id: 35, name: "Smoky BBQ Grilled Steak", category: "steaks",
    desc: "Basted in a smoky BBQ glaze and seared to perfection.",
    img: IMG.steakSliced, badge: "chef",
    options: [{ label: "Chicken", price: 1699 }, { label: "Beef", price: 2299 }] },

  // 6. Pasta & Others
  { id: 36, name: "Krunchy Pasta", category: "pasta",
    desc: "Penne tossed in a bold red sauce with a crunchy topping.",
    img: IMG.pastaRed, badge: "spicy", price: 899 },
  { id: 37, name: "Flaming Pasta", category: "pasta",
    desc: "Fiery chilli-infused pasta for the heat-seekers.",
    img: IMG.pastaFiery, badge: "spicy", price: 899 },
  { id: 38, name: "Alfredo Fresco", category: "pasta",
    desc: "Silky, creamy alfredo sauce tossed through fettuccine.",
    img: IMG.pastaCreamy, price: 999 },
  { id: 39, name: "Grill Out Special Lasagne", category: "pasta",
    desc: "Layers of pasta, rich meat sauce & melted cheese, oven-baked.",
    img: IMG.lasagne, badge: "chef", price: 949 },

  // 7. Wraps & Special Fries
  { id: 40, name: "Behari Roll", category: "wraps",
    desc: "Spiced behari beef rolled in a soft paratha wrap.",
    img: IMG.wrapBeefRoll, price: 699 },
  { id: 41, name: "Arabic Roll", category: "wraps",
    desc: "Grilled chicken, garlic sauce & pickles in a warm Arabic wrap.",
    img: IMG.wrapShawarma, price: 699 },
  { id: 42, name: "Fajita Wrap", category: "wraps",
    desc: "Grilled fajita chicken wrapped with crunchy slaw.",
    img: IMG.wrap, price: 449 },
  { id: 43, name: "Loaded Cheese Fries", category: "wraps",
    desc: "Golden fries loaded with melted cheese & house sauce.",
    img: IMG.friesLoaded, badge: "spicy", price: 649 },
  { id: 44, name: "Loaded Pizza Fries", category: "wraps",
    desc: "Fries topped with pizza sauce, mozzarella & toppings.",
    img: IMG.friesPizzaStyle, price: 699 },
  { id: 45, name: "Chilli Cheese Fries", category: "wraps",
    desc: "Crispy fries smothered in chilli-cheese sauce.",
    img: IMG.friesChilliCheese, badge: "spicy", price: 549 },

  // 8. Chicken Corner & Broast
  { id: 46, name: "Arabic Broast", category: "broast",
    desc: "Crispy golden broasted chicken, marinated in our secret spice blend.",
    img: IMG.broast,
    options: [{ label: "1 Pc", price: 349 }, { label: "2 Pcs", price: 649 }, { label: "5 Pcs", price: 1599 }] },
  { id: 47, name: "Smoke & Grill Chicken", category: "broast",
    desc: "Smoke-grilled chicken piece served with dip, or as a full meal.",
    img: IMG.steakChicken, badge: "chef",
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
    img: IMG.soupCorn,
    options: [{ label: "Single", price: 399 }, { label: "Family", price: 1049 }] },
  { id: 71, name: "Hot n Sour Soup", category: "soups",
    desc: "Tangy, peppery broth with a warming chilli kick.",
    img: IMG.soupHotSour, badge: "spicy",
    options: [{ label: "Single", price: 399 }, { label: "Family", price: 1049 }] },
  { id: 72, name: "Thai Soup", category: "soups",
    desc: "Fragrant Thai-style broth loaded with fresh herbs.",
    img: IMG.soupThai,
    options: [{ label: "Single", price: 399 }, { label: "Family", price: 1049 }] },

  // 15. Wings
  { id: 73, name: "Fried Wings", category: "wings",
    desc: "Classic golden-fried chicken wings.",
    img: IMG.wingsCrispyDry, options: [{ label: "5 Pcs", price: 499 }, { label: "10 Pcs", price: 899 }] },
  { id: 74, name: "Honey Wings", category: "wings",
    desc: "Crispy wings glazed in sweet honey sauce.",
    img: IMG.wingsGlazed, options: [{ label: "5 Pcs", price: 549 }, { label: "10 Pcs", price: 999 }] },
  { id: 75, name: "Grilled Wings", category: "wings",
    desc: "Char-grilled wings, smoky and lightly spiced.",
    img: IMG.wings, options: [{ label: "5 Pcs", price: 449 }, { label: "10 Pcs", price: 799 }] },
  { id: 76, name: "Peri Peri Wings", category: "wings",
    desc: "Fiery peri peri glaze over crispy wings.",
    img: IMG.wingsSaucyRed, badge: "spicy",
    options: [{ label: "5 Pcs", price: 499 }, { label: "10 Pcs", price: 899 }] },
  { id: 77, name: "BBQ Wings", category: "wings",
    desc: "Smoky BBQ-glazed wings, grilled to a sticky finish.",
    img: IMG.wingsGlazed, badge: "chef",
    options: [{ label: "5 Pcs", price: 499 }, { label: "10 Pcs", price: 849 }] },

  // 16. Thai Chinese & Noodles / Rice
  { id: 78, name: "Chicken Chilli Dry with Rice", category: "thai-chinese",
    desc: "Wok-tossed chicken in a bold chilli-garlic glaze, served with rice.",
    img: IMG.stirFryChilliRed, badge: "spicy", price: 999 },
  { id: 79, name: "Beef Chilli Dry with Rice", category: "thai-chinese",
    desc: "Tender beef strips in a fiery dry chilli sauce, served with rice.",
    img: IMG.stirFryRice, badge: "spicy", price: 1299 },
  { id: 80, name: "Chicken Manchurian with Rice", category: "thai-chinese",
    desc: "Deep-fried chicken tossed in tangy Indo-Chinese Manchurian sauce.",
    img: IMG.stirFryManchurian, price: 949 },
  { id: 81, name: "Oyster Chicken with Rice", category: "thai-chinese",
    desc: "Chicken stir-fried in rich oyster sauce with vegetables.",
    img: IMG.stirFryOyster, price: 949 },
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
    img: IMG.latteHot,
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
const CART_KEY = "grillout:cart";
const cart = (() => {
  // Restore a saved cart, keeping only lines that still make sense (a known
  // menu item, a whole-number quantity 1-50). The server re-prices everything
  // at checkout anyway; this is purely so nothing is lost across a login.
  try {
    const saved = JSON.parse(sessionStorage.getItem(CART_KEY) || "{}");
    const restored = {};
    for (const [key, line] of Object.entries(saved)) {
      const known = line && MENU_ITEMS.some((m) => m.id === line.id);
      if (known && Number.isInteger(line.qty) && line.qty >= 1 && line.qty <= 50 && typeof line.option === "string") {
        restored[key] = { id: line.id, option: line.option, qty: line.qty };
      }
    }
    return restored;
  } catch {
    return {};
  }
})();

function saveCart() {
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* storage blocked — the cart just won't survive a page change */
  }
}

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
function renderFilterTabs() {
  filterTabsEl.innerHTML = CATEGORIES.map(
    (c, i) => `
  <button type="button" data-filter="${esc(c.key)}" aria-pressed="${i === 0}"
    class="rounded-full border px-5 py-2 text-sm font-semibold transition
      ${i === 0 ? "border-orange-600 bg-orange-600 text-white" : "border-white/10 text-gray-400 hover:border-flame hover:text-flame"}">
    ${esc(c.label)}
  </button>`
  ).join("");
}
renderFilterTabs();

// ---- Menu rendering ------------------------------------------------------
const menuGrid = document.getElementById("menu-grid");

function optionButtonsHtml(item) {
  return `
    <div class="mt-4 flex flex-wrap gap-2">
      ${item.options
        .map(
          (opt) => `
        <button type="button" data-add-to-cart="${item.id}" data-option="${esc(opt.label)}"
          class="add-to-cart-btn rounded-full border border-orange-600/50 bg-orange-600/10 px-3 py-1.5 text-xs font-semibold text-orange-400
            transition hover:bg-orange-600 hover:text-white active:scale-95">
          ${esc(opt.label)} <span class="opacity-80">· ${formatPrice(opt.price)}</span>
        </button>`
        )
        .join("")}
    </div>`;
}

const soldOutHtml = `<p class="mt-4 rounded-full border border-white/10 px-4 py-2.5 text-center text-sm font-semibold text-gray-500" role="status">Sold out</p>`;

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

// The image bank uses Unsplash URLs that carry a width parameter (w=800); the
// same photo is requested at 400/800 so phones and 3-column desktop cards don't
// each download the largest size.
function menuImgSrcSet(url) {
  if (!/[?&]w=800\b/.test(url)) return "";
  const at = (w) => url.replace(/([?&])w=800\b/, "$1w=" + w) + " " + w + "w";
  return `srcset="${at(400)}, ${at(800)}" sizes="(min-width: 1024px) 400px, (min-width: 640px) 45vw, 100vw"`;
}

function renderMenuCard(item) {
  const badge = item.badge ? BADGES[item.badge] : null;
  const priceBadge = item.price ? formatPrice(item.price) : null;

  return `
    <article class="menu-card group relative flex flex-col overflow-hidden rounded-2xl
        border border-white/5 bg-[#1a1a1a] transition-[border-color,box-shadow] duration-300
        hover:border-orange-500/40 hover:shadow-[0_10px_40px_-10px_rgba(255,107,0,0.35)]"
        data-category="${esc(item.category)}"
        data-tilt data-tilt-max="6" data-tilt-speed="500" data-tilt-glare data-tilt-max-glare="0.12" data-tilt-scale="1.015">
      <div class="relative overflow-hidden">
        <img src="${esc(item.img)}" ${menuImgSrcSet(item.img)} alt="${esc(item.name)}" width="400" height="208" loading="lazy" decoding="async"
          onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'h-52 w-full flex items-center justify-center text-6xl bg-gradient-to-br from-[#2a1a10] via-[#331505] to-[#1a1010]',textContent:'🍽️'}))"
          class="h-52 w-full object-cover transition duration-500 group-hover:scale-110" />
        ${badge ? `<span class="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${badge.classes} shadow">${badge.label}</span>` : ""}
        ${priceBadge ? `<span class="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-sm font-bold text-orange-400 backdrop-blur">${priceBadge}</span>` : ""}
      </div>
      <div class="flex flex-1 flex-col p-5">
        <h3 class="font-display text-2xl tracking-wide text-white">${esc(item.name)}</h3>
        <p class="mt-2 flex-1 text-sm leading-relaxed text-gray-400">${esc(item.desc)}</p>
        ${item.available === false ? soldOutHtml : item.options ? optionButtonsHtml(item) : singlePriceButtonHtml(item)}
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
    btn.setAttribute("aria-pressed", String(active));
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
const checkoutFieldsEl = document.getElementById("checkout-fields");
const checkoutAccountEl = document.getElementById("checkout-account");
const checkoutLoginEl = document.getElementById("checkout-login");
const checkoutPhoneEl = document.getElementById("checkout-phone");
const checkoutAddressEl = document.getElementById("checkout-address");
const checkoutErrorEl = document.getElementById("checkout-error");
let checkoutOrderType = "pickup";

document.querySelectorAll(".order-type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    checkoutOrderType = btn.dataset.orderType;
    document.querySelectorAll(".order-type-btn").forEach((b) => {
      const active = b === btn;
      b.classList.toggle("bg-orange-600", active);
      b.classList.toggle("border-orange-600", active);
      b.classList.toggle("text-white", active);
      b.classList.toggle("border-white/10", !active);
      b.classList.toggle("text-gray-400", !active);
      b.setAttribute("aria-pressed", String(active));
    });
    checkoutAddressEl.hidden = checkoutOrderType !== "delivery";
  });
});

// While closed the drawer is inert: it's only translated off-screen, so without
// this its buttons would still be reachable with the Tab key.
let cartOpener = null;

function openCart() {
  refreshAccountUi();
  cartOpener = document.activeElement;
  cartDrawer.inert = false;
  cartDrawer.classList.add("open");
  cartBackdrop.classList.add("open");
  document.body.classList.add("overflow-hidden");
  cartDrawer.querySelector("[data-cart-close]").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartBackdrop.classList.remove("open");
  document.body.classList.remove("overflow-hidden");
  cartDrawer.inert = true;
  if (cartOpener && document.contains(cartOpener)) cartOpener.focus();
  cartOpener = null;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && cartDrawer.classList.contains("open")) closeCart();
});

function renderCart() {
  const lines = Object.entries(cart).filter(([, line]) => line.qty > 0);

  cartEmptyEl.classList.toggle("hidden", lines.length > 0);
  cartItemsEl.classList.toggle("hidden", lines.length === 0);
  checkoutFieldsEl.classList.toggle("hidden", lines.length === 0);

  cartItemsEl.innerHTML = lines
    .map(([key, line]) => {
      const item = MENU_ITEMS.find((m) => m.id === line.id);
      const price = priceFor(item, line.option);
      const label = esc(line.option && line.option !== "default" ? `${item.name} (${line.option})` : item.name);

      return `
        <li class="flex items-center gap-3 border-b border-white/5 py-4">
          <img src="${esc(item.img)}" alt="${esc(item.name)}" width="64" height="64" loading="lazy" decoding="async" class="h-16 w-16 rounded-xl object-cover"
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

  saveCart();
  cartTotalEl.textContent = formatPrice(cartTotal());
  cartCountBadges.forEach((el) => {
    const count = cartCount();
    el.textContent = count;
    el.classList.toggle("hidden", count === 0);
  });
}

function addToCart(id, option, buttonEl) {
  const menuItem = MENU_ITEMS.find((m) => m.id === id);
  if (!menuItem || menuItem.available === false) return;
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

function showCheckoutError(message) {
  checkoutErrorEl.textContent = message;
  checkoutErrorEl.classList.remove("hidden");
}

function clearCheckoutError() {
  checkoutErrorEl.classList.add("hidden");
  checkoutErrorEl.textContent = "";
}

const checkoutBtn = document.getElementById("checkout-btn");
const checkoutLabel = document.getElementById("checkout-label");

function showLoginRequired() {
  checkoutLoginEl.classList.remove("hidden");
  const next = "/?resume=cart";
  document.getElementById("checkout-login-link").setAttribute("href", loginUrl(next));
  document.getElementById("checkout-signup-link").setAttribute("href", signupUrl(next));
  saveCart();
}

checkoutBtn.addEventListener("click", async () => {
  if (cartCount() === 0) return;
  clearCheckoutError();
  checkoutLoginEl.classList.add("hidden");

  // Ordering needs an account. The cart is already saved, so after logging in
  // the customer lands back here with it intact (see ?resume=cart below).
  const me = await Account.me();
  if (!me) {
    showLoginRequired();
    return;
  }

  const phone = checkoutPhoneEl.value.trim();
  const deliveryAddress = checkoutAddressEl.value.trim();

  if (!phone) {
    showCheckoutError("Please enter a phone number we can reach you on.");
    return;
  }
  if (checkoutOrderType === "delivery" && !deliveryAddress) {
    showCheckoutError("Please enter a delivery address.");
    return;
  }

  const items = Object.values(cart)
    .filter((line) => line.qty > 0)
    .map((line) => ({
      menuItemId: line.id,
      ...(line.option && line.option !== "default" ? { optionLabel: line.option } : {}),
      quantity: line.qty,
    }));

  const originalText = checkoutLabel.textContent;
  checkoutBtn.disabled = true;
  checkoutLabel.textContent = "Placing order…";

  try {
    // Name and email come from the account on the server; the client only
    // says what and where. (Prices are never sent — the server prices the order.)
    const res = await apiFetch("/orders", {
      method: "POST",
      body: {
        phone,
        items,
        orderType: checkoutOrderType,
        ...(checkoutOrderType === "delivery" ? { deliveryAddress } : {}),
      },
    });

    if (res.status === 401) {
      // Session expired since the page loaded.
      Account.set(null);
      refreshAccountUi();
      checkoutLabel.textContent = originalText;
      checkoutBtn.disabled = false;
      showLoginRequired();
      return;
    }
    if (!res.ok) {
      throw new Error(apiErrorMessage(res, "Could not place your order. Please try again."));
    }

    checkoutLabel.textContent = `Order Placed! 🔥 (${res.data.id})`;
    setTimeout(() => {
      Object.keys(cart).forEach((key) => delete cart[key]);
      renderCart();
      MENU_ITEMS.forEach((item) => syncCardLabel(item.id));
      checkoutPhoneEl.value = "";
      checkoutAddressEl.value = "";
      checkoutLabel.textContent = originalText;
      checkoutBtn.disabled = false;
      closeCart();
    }, 2000);
  } catch (err) {
    checkoutLabel.textContent = originalText;
    checkoutBtn.disabled = false;
    showCheckoutError(
      err instanceof TypeError
        ? "Can't reach the server right now. Please check your connection and try again."
        : err.message
    );
  }
});

// ---- Mobile nav ------------------------------------------------------------
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
const hamburgerIcon = document.getElementById("hamburger-icon");
const closeIcon = document.getElementById("close-icon");

mobileMenuBtn.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.toggle("open-menu");
  mobileMenu.inert = !isOpen;
  mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
  mobileMenuBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  mobileMenu.classList.toggle("max-h-0");
  mobileMenu.classList.toggle("max-h-[28rem]");
  hamburgerIcon.classList.toggle("hidden", isOpen);
  closeIcon.classList.toggle("hidden", !isOpen);
});

mobileMenu.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open-menu", "max-h-[28rem]");
    mobileMenu.classList.add("max-h-0");
    mobileMenu.inert = true;
    mobileMenuBtn.setAttribute("aria-expanded", "false");
    mobileMenuBtn.setAttribute("aria-label", "Open menu");
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
{
  // Local-date "today" (toISOString would be UTC and can be off by a day).
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  document.getElementById("reservation-date").min = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  document.getElementById("year").textContent = now.getFullYear();
}
const reservationSuccess = document.getElementById("reservation-success");
const reservationErrorEl = document.getElementById("reservation-error");
const reservationSubmitBtn = document.getElementById("reservation-submit");
const reservationSubmitLabel = document.getElementById("reservation-submit-label");

const RES_DRAFT_KEY = "grillout:resDraft";
const reservationLoginEl = document.getElementById("reservation-login");
const RES_FIELDS = ["res-phone", "reservation-date", "res-time", "res-guests", "res-notes"];

function saveReservationDraft() {
  try {
    const draft = {};
    RES_FIELDS.forEach((id) => (draft[id] = document.getElementById(id).value));
    sessionStorage.setItem(RES_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage blocked — they just retype after logging in */
  }
}

function restoreReservationDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(RES_DRAFT_KEY) || "null");
    if (!draft) return;
    RES_FIELDS.forEach((id) => {
      if (typeof draft[id] === "string") document.getElementById(id).value = draft[id];
    });
  } catch {
    /* ignore a corrupt draft */
  }
}

function clearReservationDraft() {
  try {
    sessionStorage.removeItem(RES_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function showReservationLogin() {
  saveReservationDraft();
  const next = "/#reservations";
  document.getElementById("reservation-login-link").setAttribute("href", loginUrl(next));
  document.getElementById("reservation-signup-link").setAttribute("href", signupUrl(next));
  reservationLoginEl.classList.remove("hidden");
  reservationLoginEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

restoreReservationDraft();

reservationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  reservationErrorEl.classList.add("hidden");
  reservationLoginEl.classList.add("hidden");

  // Reserving needs an account; the form is kept so they return to it.
  const me = await Account.me();
  if (!me) {
    showReservationLogin();
    return;
  }

  // Name and email come from the account on the server — not from this form.
  const payload = {
    phone: document.getElementById("res-phone").value.trim(),
    date: document.getElementById("reservation-date").value,
    time: document.getElementById("res-time").value,
    guests: document.getElementById("res-guests").value,
  };
  const notes = document.getElementById("res-notes").value.trim();
  if (notes) payload.specialRequests = notes;

  const originalLabel = reservationSubmitLabel.textContent;
  reservationSubmitBtn.disabled = true;
  reservationSubmitLabel.textContent = "Booking…";

  try {
    const res = await apiFetch("/reservations", { method: "POST", body: payload });

    if (res.status === 401) {
      Account.set(null);
      refreshAccountUi();
      showReservationLogin();
      return;
    }
    if (!res.ok) {
      throw new Error(apiErrorMessage(res, "Could not confirm your reservation."));
    }

    clearReservationDraft();
    reservationForm.classList.add("hidden");
    reservationSuccess.classList.remove("hidden");
  } catch (err) {
    reservationErrorEl.textContent =
      err instanceof TypeError
        ? "Can't reach the server right now. Please check your connection and try again."
        : err.message;
    reservationErrorEl.classList.remove("hidden");
  } finally {
    reservationSubmitBtn.disabled = false;
    reservationSubmitLabel.textContent = originalLabel;
  }
});

document.getElementById("reservation-reset").addEventListener("click", () => {
  reservationForm.reset();
  reservationForm.classList.remove("hidden");
  reservationSuccess.classList.add("hidden");
  reservationErrorEl.classList.add("hidden");
});

// ---- Account-aware UI -------------------------------------------------------
// Nav link (Login / My Account), the "ordering as" line in the cart, and the
// name shown on the reservation form all follow the logged-in customer.
async function refreshAccountUi() {
  const me = await Account.me();
  updateAccountLinks();

  if (me) {
    checkoutAccountEl.textContent = `Ordering as ${me.name}`;
    checkoutAccountEl.classList.remove("hidden");
    checkoutLoginEl.classList.add("hidden");
    reservationLoginEl.classList.add("hidden");
  } else {
    checkoutAccountEl.classList.add("hidden");
  }

  const resName = document.getElementById("res-name");
  if (me) {
    resName.value = me.name;
    resName.readOnly = true;
  } else {
    if (resName.readOnly) resName.value = "";
    resName.readOnly = false;
  }
}

refreshAccountUi().then(async () => {
  // Coming back from /login or /signup with an order in progress: reopen the cart.
  const params = new URLSearchParams(location.search);
  if (params.get("resume") === "cart") {
    history.replaceState(null, "", location.pathname + location.hash);
    if ((await Account.me()) && cartCount() > 0) openCart();
  }
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

// ---- Live menu ---------------------------------------------------------------
// The menu above is only the fallback (offline / API down). When the API answers,
// its menu wins: prices, sizes, names, sold-out flags and hidden categories all come
// from the database the admin edits, so what a customer sees is what they are charged.
async function syncMenuFromApi() {
  let menuRes, catRes;
  try {
    [menuRes, catRes] = await Promise.all([apiFetch("/menu"), apiFetch("/categories")]);
  } catch {
    return; // API unreachable — keep the built-in menu
  }
  if (!menuRes.ok || !catRes.ok || !Array.isArray(menuRes.data) || !Array.isArray(catRes.data)) return;
  if (menuRes.data.length === 0) return;

  const live = menuRes.data.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    desc: m.description,
    img: m.image,
    available: m.available !== false,
    badge: (m.tags || []).includes("spicy") ? "spicy" : m.featured ? "chef" : undefined,
    ...(m.options && m.options.length ? { options: m.options } : { price: m.price }),
  }));
  MENU_ITEMS.splice(0, MENU_ITEMS.length, ...live);
  CATEGORIES.splice(0, CATEGORIES.length, { key: "all", label: "All" }, ...catRes.data.map((c) => ({ key: c.key, label: c.label })));

  // Drop cart lines for dishes/sizes that no longer exist or are sold out, and say so.
  let removed = 0;
  for (const [key, line] of Object.entries(cart)) {
    const item = MENU_ITEMS.find((m) => m.id === line.id);
    const sizeOk = item && (item.options ? item.options.some((o) => o.label === line.option) : line.option === "default");
    if (!item || item.available === false || !sizeOk) {
      delete cart[key];
      removed += 1;
    }
  }

  renderFilterTabs();
  renderMenu();
  applyFilter("all");
  renderCart();
  if (!prefersReducedMotion && !isCoarsePointer && window.VanillaTilt) {
    VanillaTilt.init(document.querySelectorAll(".menu-card[data-tilt]"), { perspective: 900, glare: true });
  }
  if (removed > 0) {
    showCheckoutError("Some items in your cart are no longer available and were removed.");
  }
}

// ---- Init --------------------------------------------------------------------
renderMenu();
applyFilter("all");
renderCart();
syncMenuFromApi();

// Menu cards are injected after load, so their tilt needs its own init pass
// (desktop only — see the coarse-pointer note above).
if (!prefersReducedMotion && !isCoarsePointer && window.VanillaTilt) {
  VanillaTilt.init(document.querySelectorAll(".menu-card[data-tilt]"), { perspective: 900, glare: true });
}

// Minimum bookable date is today.
// (Today in the restaurant's timezone, not the visitor's or UTC — the server checks the same clock.)
document.getElementById("reservation-date").min = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
