-- Gear seed data — replace affiliate_url values with your real affiliate links
-- Run after 005_gear.sql
-- Uses INSERT IGNORE so re-running is safe

INSERT IGNORE INTO gear (slug, name, category, description, recommended_for, sort_order) VALUES

-- Thermometers
('thermapen-one',       'Thermapen ONE',              'Thermometers',     'Instant-read thermometer — reads in 1 second. The gold standard for BBQ.',                        'all',                              1),
('meater-plus',         'MEATER+',                    'Thermometers',     'Wireless smart probe — monitor from your phone up to 50m away.',                                   'Smoker,Kamado,Oven',               2),
('thermoworks-smoke',   'ThermoWorks Smoke',          'Thermometers',     'Dual-probe remote thermometer — monitor pit and meat simultaneously.',                             'Smoker,Kamado,Wood Fire',          3),
('inkbird-ibt-4xs',     'Inkbird IBT-4XS',            'Thermometers',     'Bluetooth 4-probe thermometer — great value for multi-protein cooks.',                            'all',                              4),

-- Smokers & Cookers
('weber-smokey-mountain-18', 'Weber Smokey Mountain 18"', 'Smokers',      'The classic water smoker. Reliable, affordable, beloved by competition pitmasters.',             'Smoker',                           10),
('weber-kettle-57',     'Weber Kettle 57cm',          'Smokers',          'The iconic charcoal kettle — grilling, smoking, roasting all in one.',                            'Charcoal Kettle,BBQ (Charcoal/Gas)',11),
('big-green-egg-large', 'Big Green Egg (Large)',       'Smokers',          'The original kamado — retains heat like nothing else. Built to last a lifetime.',                'Kamado',                           12),
('pit-barrel-cooker',   'Pit Barrel Cooker',          'Smokers',          'Drum smoker — incredibly simple, produces outstanding smoke flavour.',                            'Smoker',                           13),
('napoleon-pro-500',    'Napoleon PRO 500',           'Smokers',          'Premium gas grill with infrared sear zone and smoker tray.',                                      'BBQ (Charcoal/Gas)',               14),

-- Charcoal & Fuel
('weber-briquettes-8kg','Weber Briquettes 8kg',       'Charcoal & Fuel',  'Long-burn briquettes — consistent heat, low ash. Perfect for low-and-slow.',                    'Charcoal Kettle,Smoker',           20),
('jealous-devil-lump',  'Jealous Devil Lump Charcoal','Charcoal & Fuel',  'Premium hardwood lump — burns hotter and cleaner than briquettes.',                              'Kamado,BBQ (Charcoal/Gas)',        21),
('weber-hickory-chunks','Weber Hickory Wood Chunks',  'Charcoal & Fuel',  'Hickory chunks for bold smoky flavour. Great with beef and pork.',                               'Smoker,Kamado,Wood Fire',          22),
('weber-applewood-chips','Weber Apple Wood Chips',    'Charcoal & Fuel',  'Mild, sweet smoke — ideal for chicken, fish, and pork.',                                         'Smoker,Kamado,Charcoal Kettle',    23),
('fire-starters-pack',  'Weber Fire Starters (50pk)', 'Charcoal & Fuel',  'Odourless, reliable fire starters. Never use lighter fluid again.',                              'all',                              24),

-- Rubs & Seasonings
('killer-hogs-bbq-rub', 'Killer Hogs The BBQ Rub',   'Rubs & Seasonings','Championship-winning rub — the benchmark for competition-style BBQ flavour.',                   'all',                              30),
('meat-church-holy-gospel','Meat Church Holy Gospel', 'Rubs & Seasonings','All-purpose BBQ rub — sweet heat with a Tex-Mex influence.',                                    'all',                              31),
('lanes-bbq-signature', 'Lane''s BBQ Signature Blend','Rubs & Seasonings','Savoury-sweet blend — works on everything from brisket to veggies.',                            'all',                              32),
('maldon-sea-salt',     'Maldon Sea Salt Flakes',     'Rubs & Seasonings','Finishing salt for steaks and grilled proteins — a little goes a long way.',                    'all',                              33),

-- Accessories
('weber-chimney-starter','Weber Chimney Starter',     'Accessories',      'Light charcoal in 15 minutes — no lighter fluid, no mess.',                                      'Charcoal Kettle,Smoker,Kamado',    40),
('rapicca-bbq-gloves',  'RAPICCA BBQ Gloves (932°F)', 'Accessories',      'Heat-resistant gloves rated to 500°C — pull pork bare-handed like a pro.',                      'all',                              41),
('spitjack-injector',   'SpitJack Magnum Meat Injector','Accessories',    'Professional-grade injector — marinades deep into thick cuts like brisket and shoulder.',       'Smoker,Kamado,Oven',               42),
('oxo-basting-brush',   'OXO Silicone Basting Brush', 'Accessories',      'Silicone bristles hold sauce perfectly — dishwasher safe.',                                      'all',                              43),
('teakhaus-xl-board',   'Teakhaus XL Teak Cutting Board','Accessories',   'Extra-large teak board — perfect for resting and slicing whole briskets.',                      'all',                              44),
('instant-read-timer',  'ThermoWorks TimeStack Timer', 'Accessories',      '4-channel kitchen timer — track multiple milestones in your cook simultaneously.',              'all',                              45);
