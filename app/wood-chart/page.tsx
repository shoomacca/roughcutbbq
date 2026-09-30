import React from 'react';const WOODS = [
  {
    name: "Alder",
    profile: "Light, sweet, natural flavor",
    strength: "Mild",
    description: "Alder is mostly used for seafood and fish but it works well with beef and pork too. Overall, it has a light, sweet and natural flavor which is not overpowering. It is less dense than most of the other woods and is very similar to cedar.",
    greatFor: "Salmon, Seafood & fish. Poultry & Pork",
    icon: "🐟",
  },
  {
    name: "Apple",
    profile: "Light, fruity & sweet aroma",
    strength: "Mild",
    description: "Apple has a light, fruity & sweet aroma and is mainly used for pork and poultry. It requires a lot of time to penetrate into food, which is the main reason why it is recommended for longer smoking. You can get good results even if you combine it with other types, such as mesquite, oak or cherry.",
    greatFor: "Poultry, Beef, Pork, Lamb & Certain Seafood",
    icon: "🍎",
  },
  {
    name: "Hickory",
    profile: "Strong bacon flavor",
    strength: "Strong",
    description: "Hickory is probably the most popular smoke wood for many. It has a strong, stinging profile that gives the food a sweet and strong bacon flavor at the same time. It can be overwhelming, giving the meat a strong bitter flavor, especially if it is used in large amounts. Most people prefer to mix it with other woods to have better results.",
    greatFor: "Ribs, Pork Shoulders, Red meat and Poultry",
    icon: "🥓",
  },
  {
    name: "Oak",
    profile: "Medium smoky flavor",
    strength: "Medium",
    description: "Oak is another very popular type of wood. It is very versatile and can be used for any bbq meat. It generates a medium smoky flavor, a little bit stronger when compared to apple or cherry but lighter than hickory or mesquite. It can be combined well with all these woods or can be used by itself.",
    greatFor: "Almost any type of meat, Lamb, Beef, Brisket, Chicken, Sausages",
    icon: "🌳",
  },
  {
    name: "Cherry",
    profile: "Subtle, sweet fruity flavor",
    strength: "Mild",
    description: "One of the most popular choices for poultry and chicken. It gives a slightly red color and subtle, sweet fruity flavor to the meat. It can be combined with alder, pecan, hickory or oak and goes very well with poultry, beef & pork.",
    greatFor: "Poultry, Beef, Pork",
    icon: "🍒",
  },
  {
    name: "Mesquite",
    profile: "Intense earthy flavor",
    strength: "Strong",
    description: "Mesquite is quite popular in Texas barbecues. It generates an intense earthy flavor, which can easily become overpowered for your food and give it a negative flavor and scent. Since this type burns down very fast, it is a great option for hot and fast bbq techniques and smoking meat.",
    greatFor: "Mostly red and dark meat",
    icon: "🥩",
  },
  {
    name: "Maple",
    profile: "Subtle, sweet smoky flavor",
    strength: "Mild",
    description: "Mild flavor type of wood, with a subtle, sweet smoky flavor. It works great with other woods too, such as alder, oak, and apple. It is dense in weight but has a light color.",
    greatFor: "Poultry, Vegetables & Cheese",
    icon: "🍁",
  },
  {
    name: "Pecan",
    profile: "Rich, sweet, nutty flavor",
    strength: "Medium",
    description: "Pecan has a rich, sweet flavor and kind-of spicy profile, with a nutty flavor weaker than hickory. Don't go overboard as it will result in a bitter and acrid flavor. It is good for combining with other strong-flavor woods, like oak for example.",
    greatFor: "Beef, Pork and Poultry",
    icon: "🥜",
  },
  {
    name: "Walnut",
    profile: "Strong, heavy, bitter flavor",
    strength: "Strong",
    description: "Walnut wood generates mostly a strong, heavy, bitter flavor, making it good for cooking red meat. It is recommended to mix it with other delicate types to make the aroma a little bit softer, especially during long smoking sessions.",
    greatFor: "Mostly Red Meat",
    icon: "🌰",
  },
  {
    name: "Pear",
    profile: "Light, sweet, fruity flavor",
    strength: "Mild",
    description: "Light, sweet, fruity flavor profile that is great for smoking pork and poultry. Very similar to apple if you compare the flavors.",
    greatFor: "Pork and Poultry",
    icon: "🍐",
  },
  {
    name: "Peach",
    profile: "Mild, sweeter flavor",
    strength: "Mild",
    description: "Peach is another fruitwood that works great with poultry and pork, giving a mild, sweeter flavor, very similar but lighter than Hickory.",
    greatFor: "Poultry and Pork",
    icon: "🍑",
  },
  {
    name: "Mulberry",
    profile: "Mild, sweet, fruity flavor",
    strength: "Mild",
    description: "Very similar wood to apple. It has a mild, sweet, fruity flavor, making a good option for most meat types.",
    greatFor: "Most types of meat, especially recommended for poultry, fish, and pork",
    icon: "🍇",
  },
  {
    name: "Citrus",
    profile: "Light, sweet, fruity and citrus flavor",
    strength: "Mild",
    description: "Citrus is not as popular as the other types on this list. It has a light, sweet, fruity and citrus flavor, working great for most meat types.",
    greatFor: "Most meat types, especially recommended for Poultry and Pork",
    icon: "🍋",
  },
  {
    name: "Grap Vine",
    profile: "Strong fruit wood, acrid smoke flavor",
    strength: "Strong",
    description: "You should be careful when using grap vine for smoking. It is a strong fruit wood, with an acrid smoke flavor that will easily overpower the flavor of your meat if you go overboard.",
    greatFor: "Poultry, Lamb, or Some type of Red Meats",
    icon: "🍷",
  },
  {
    name: "Guava",
    profile: "Semi-sweet aroma",
    strength: "Medium",
    description: "Guava is a fruit wood coming from Hawaii and other tropical regions. It is a member of the Myrtle family has a semi-sweet aroma, which goes well with beef, pork, lamb, poultry, and fish.",
    greatFor: "Beef, pork, lamb, poultry, and fish",
    icon: "🌴",
  },
  {
    name: "Kiawe",
    profile: "Strong flavor, related to mesquite",
    strength: "Strong",
    description: "Kiawe is another type of wood coming from the Hawaii region. It is related to mesquite and has a strong flavor. It is very dense and gives a dark, smooth, thin bark. Very hard to find in stores.",
    greatFor: "Beef, Fish, and Poultry",
    icon: "🪵",
  },
  {
    name: "Wine Barrel Chunks",
    profile: "Winery cellar aroma",
    strength: "Medium",
    description: "Another not-so-common type you can give a try when smoking meat. Wine barrel chunks are cut of woods from the wine barrels, once they reach the end of their life. They have the same aroma you experience when visiting the winery cellars.",
    greatFor: "Mostly red meat and Beef",
    icon: "🛢️",
  },
];

export default function WoodChartPage() {
  return (
    <div className="relative w-full flex flex-col items-center pb-20 pt-8">
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#FAF6E9] mb-4" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
            Wood Smoking Chart
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            The ultimate guide to choose the best wood for your BBQ. Learn about flavor profiles, strengths, and standard pairings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {WOODS.map((wood) => (
            <div 
              key={wood.name}
              className="rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {wood.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#FAF6E9]">{wood.name}</h2>
                  <div className="flex gap-2 text-xs font-semibold uppercase tracking-wider mt-1">
                    <span className={wood.strength === 'Strong' ? 'text-red-400' : wood.strength === 'Medium' ? 'text-orange-300' : 'text-[#5A9B6A]'}>
                      {wood.strength}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-white/50">{wood.profile}</span>
                  </div>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                {wood.description}
              </p>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs font-bold text-[#FAF6E9] uppercase tracking-wider mb-1">Great For</p>
                <p className="text-sm text-white/80">{wood.greatFor}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-[#FAF6E9] mb-4">Woods to Avoid</h2>
          <p className="text-white/60 text-sm max-w-xl mx-auto leading-relaxed">
            Never smoke with wood that has been painted, stained, or treated. Avoid softwoods (Pine, Cedar, Fir, Spruce) as they are sappy and contain terpenes that can make meat taste odd or make you ill. Also avoid old woods covered in mold or fungus.
          </p>
        </div>
      </div>
    </div>
  );
}
