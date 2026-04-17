const Basket = require('../models/Basket');
const RebalanceHistory = require('../models/RebalanceHistory');
const emailService = require('./emailService');
const { getEnrichedUniverseData } = require('./stockDataService');

// ─── Universe definition — only ticker + companyName (no static prices) ────────
const STOCK_UNIVERSE = {
  largeCap: [
    { ticker: 'RELIANCE.NS',   companyName: 'Reliance Industries'      },
    { ticker: 'TCS.NS',        companyName: 'Tata Consultancy Services' },
    { ticker: 'INFY.NS',       companyName: 'Infosys'                   },
    { ticker: 'HDFCBANK.NS',   companyName: 'HDFC Bank'                 },
    { ticker: 'ICICIBANK.NS',  companyName: 'ICICI Bank'                },
    { ticker: 'HINDUNILVR.NS', companyName: 'Hindustan Unilever'        },
    { ticker: 'MARUTI.NS',     companyName: 'Maruti Suzuki'             },
    { ticker: 'SBIN.NS',       companyName: 'State Bank of India'       },
    { ticker: 'BAJAJFINSV.NS', companyName: 'Bajaj Finserv'             },
    { ticker: 'TITAN.NS',      companyName: 'Titan Company'             },
    { ticker: 'ASIANPAINT.NS', companyName: 'Asian Paints'              },
    { ticker: 'NESTLEIND.NS',  companyName: 'Nestle India'              },
    { ticker: 'WIPRO.NS',      companyName: 'Wipro'                     },
    { ticker: 'ITC.NS',        companyName: 'ITC Limited'               },
    { ticker: 'KOTAKBANK.NS',  companyName: 'Kotak Mahindra Bank'       },
  ],
  midCap: [
    { ticker: 'APOLLOHOSP.NS', companyName: 'Apollo Hospitals'         },
    { ticker: 'ADANIPORTS.NS', companyName: 'Adani Ports & SEZ'        },
    { ticker: 'LTTS.NS',       companyName: 'L&T Technology Services'  },
    { ticker: 'CHOLAFIN.NS',   companyName: 'Cholamandalam Finance'    },
    { ticker: 'MUTHOOTFIN.NS', companyName: 'Muthoot Finance'          },
    { ticker: 'JSWSTEEL.NS',   companyName: 'JSW Steel'                },
    { ticker: 'HINDALCO.NS',   companyName: 'Hindalco Industries'      },
    { ticker: 'INDIGO.NS',     companyName: 'IndiGo (InterGlobe)'      },
    { ticker: 'GODREJPROP.NS', companyName: 'Godrej Properties'        },
    { ticker: 'FEDERALBNK.NS', companyName: 'Federal Bank'             },
    { ticker: 'VOLTAS.NS',     companyName: 'Voltas'                   },
    { ticker: 'PAGEIND.NS',    companyName: 'Page Industries'          },
    { ticker: 'IDFCFIRSTB.NS', companyName: 'IDFC First Bank'          },
    { ticker: 'GAIL.NS',       companyName: 'GAIL India'               },
    { ticker: 'SAIL.NS',       companyName: 'Steel Authority of India' },
  ],
  smallCap: [
    { ticker: 'JUSTDIAL.NS',     companyName: 'Just Dial'               },
    { ticker: 'RADICO.NS',       companyName: 'Radico Khaitan'          },
    { ticker: 'AUBANK.NS',       companyName: 'AU Small Finance Bank'   },
    { ticker: 'KANSAINER.NS',    companyName: 'Kansai Nerolac Paints'  },
    { ticker: 'CENTURYTEX.NS',   companyName: 'Century Textiles'        },
    { ticker: 'JKCEMENT.NS',     companyName: 'JK Cement'               },
    { ticker: 'EDELWEISS.NS',    companyName: 'Edelweiss Financial'     },
    { ticker: 'NATCOPHARM.NS',   companyName: 'Natco Pharma'            },
    { ticker: 'PIDILITIND.NS',   companyName: 'Pidilite Industries'     },
    { ticker: 'DIVISLAB.NS',     companyName: "Divi's Laboratories"     },
    { ticker: 'DEEPAKNITRITE.NS',companyName: 'Deepak Nitrite'          },
    { ticker: 'RBLBANK.NS',      companyName: 'RBL Bank'                },
    { ticker: 'SOBHA.NS',        companyName: 'Sobha Ltd'               },
    { ticker: 'BRIGADE.NS',      companyName: 'Brigade Enterprises'     },
    { ticker: 'AARTIIND.NS',     companyName: 'Aarti Industries'        },
    { ticker: 'CAMS.NS',         companyName: 'CAMS'                    },
    { ticker: 'LATENTVIEW.NS',   companyName: 'LatentView Analytics'    },
    { ticker: 'MAHINDCIE.NS',    companyName: 'Mahindra CIE'            },
    { ticker: 'SUDARSCHEM.NS',   companyName: 'Sudarshan Chemical'      },
    { ticker: 'WHIRLPOOL.NS',    companyName: 'Whirlpool of India'      },
  ],
  tech: [
    { ticker: 'TCS.NS',          companyName: 'Tata Consultancy Services'},
    { ticker: 'INFY.NS',         companyName: 'Infosys'                  },
    { ticker: 'WIPRO.NS',        companyName: 'Wipro'                    },
    { ticker: 'HCLTECH.NS',      companyName: 'HCL Technologies'         },
    { ticker: 'LTTS.NS',         companyName: 'L&T Technology Services'  },
    { ticker: 'TECHM.NS',        companyName: 'Tech Mahindra'            },
    { ticker: 'PERSISTENT.NS',   companyName: 'Persistent Systems'       },
    { ticker: 'MPHASIS.NS',      companyName: 'Mphasis'                  },
    { ticker: 'COFORGE.NS',      companyName: 'Coforge'                  },
    { ticker: 'KPITTECH.NS',     companyName: 'KPIT Technologies'        },
    { ticker: 'TATAELXSI.NS',    companyName: 'Tata Elxsi'               },
    { ticker: 'LTIM.NS',         companyName: 'LTIMindtree'              },
    { ticker: 'OFSS.NS',         companyName: 'Oracle Financial Services'},
    { ticker: 'CYIENT.NS',       companyName: 'Cyient'                   },
    { ticker: 'MASTEK.NS',       companyName: 'Mastek'                   },
    { ticker: 'BIRLASOFT.NS',    companyName: 'Birlasoft'                },
    { ticker: 'ZENSAR.NS',       companyName: 'Zensar Technologies'      },
    { ticker: 'ROUTE.NS',        companyName: 'Route Mobile'             },
    { ticker: 'INTELLECT.NS',    companyName: 'Intellect Design Arena'   },
    { ticker: 'DATAMATICS.NS',   companyName: 'Datamatics Global'        },
  ],
  finance: [
    { ticker: 'HDFCBANK.NS',     companyName: 'HDFC Bank'               },
    { ticker: 'ICICIBANK.NS',    companyName: 'ICICI Bank'               },
    { ticker: 'KOTAKBANK.NS',    companyName: 'Kotak Mahindra Bank'      },
    { ticker: 'SBIN.NS',         companyName: 'State Bank of India'      },
    { ticker: 'AXISBANK.NS',     companyName: 'Axis Bank'                },
    { ticker: 'BAJAJFINSV.NS',   companyName: 'Bajaj Finserv'            },
    { ticker: 'CHOLAFIN.NS',     companyName: 'Cholamandalam Finance'    },
    { ticker: 'MUTHOOTFIN.NS',   companyName: 'Muthoot Finance'          },
    { ticker: 'IRFC.NS',         companyName: 'Indian Railway Finance'   },
    { ticker: 'PFC.NS',          companyName: 'Power Finance Corporation'},
    { ticker: 'RECLTD.NS',       companyName: 'REC Limited'              },
    { ticker: 'IDFCFIRSTB.NS',   companyName: 'IDFC First Bank'          },
    { ticker: 'BAJFINANCE.NS',   companyName: 'Bajaj Finance'            },
    { ticker: 'MANAPPURAM.NS',   companyName: 'Manappuram Finance'       },
    { ticker: 'M&MFIN.NS',       companyName: 'M&M Financial Services'   },
    { ticker: 'SUNDARMFIN.NS',   companyName: 'Sundaram Finance'         },
    { ticker: 'LICHSGFIN.NS',    companyName: 'LIC Housing Finance'      },
    { ticker: 'FEDERALBNK.NS',   companyName: 'Federal Bank'             },
    { ticker: 'BANDHANBNK.NS',   companyName: 'Bandhan Bank'             },
    { ticker: 'CANBK.NS',        companyName: 'Canara Bank'              },
  ],
  healthcare: [
    { ticker: 'SUNPHARMA.NS',    companyName: 'Sun Pharmaceutical'      },
    { ticker: 'APOLLOHOSP.NS',   companyName: 'Apollo Hospitals'        },
    { ticker: 'DIVISLAB.NS',     companyName: "Divi's Laboratories"     },
    { ticker: 'CIPLA.NS',        companyName: 'Cipla'                   },
    { ticker: 'DRREDDY.NS',      companyName: "Dr. Reddy's Laboratories"},
    { ticker: 'LUPIN.NS',        companyName: 'Lupin'                   },
    { ticker: 'TORNTPHARM.NS',   companyName: 'Torrent Pharmaceuticals' },
    { ticker: 'AUROPHARMA.NS',   companyName: 'Aurobindo Pharma'        },
    { ticker: 'ALKEM.NS',        companyName: 'Alkem Laboratories'      },
    { ticker: 'BIOCON.NS',       companyName: 'Biocon'                  },
    { ticker: 'GRANULES.NS',     companyName: 'Granules India'          },
    { ticker: 'GLENMARK.NS',     companyName: 'Glenmark Pharmaceuticals'},
    { ticker: 'ABBOTINDIA.NS',   companyName: 'Abbott India'            },
    { ticker: 'GLAXO.NS',        companyName: 'GSK Pharma India'        },
    { ticker: 'PFIZER.NS',       companyName: 'Pfizer India'            },
    { ticker: 'IPCALAB.NS',      companyName: 'IPCA Laboratories'       },
    { ticker: 'LAURUSLABS.NS',   companyName: 'Laurus Labs'             },
    { ticker: 'APLLTD.NS',       companyName: 'Alembic Pharma'         },
    { ticker: 'ERIS.NS',         companyName: 'Eris Lifesciences'       },
    { ticker: 'METROPOLIS.NS',   companyName: 'Metropolis Healthcare'   },
  ],
  renewable: [
    { ticker: 'ADANIGREEN.NS',   companyName: 'Adani Green Energy'      },
    { ticker: 'TATAPOWER.NS',    companyName: 'Tata Power'              },
    { ticker: 'NTPC.NS',         companyName: 'NTPC'                    },
    { ticker: 'SUZLON.NS',       companyName: 'Suzlon Energy'           },
    { ticker: 'INOXWIND.NS',     companyName: 'Inox Wind'               },
    { ticker: 'WAAREEENER.NS',   companyName: 'Waaree Energies'         },
    { ticker: 'SJVN.NS',         companyName: 'SJVN Limited'            },
    { ticker: 'NHPC.NS',         companyName: 'NHPC Limited'            },
    { ticker: 'BOROSIL.NS',      companyName: 'Borosil Renewables'      },
    { ticker: 'WEBSOL.NS',       companyName: 'Websol Energy System'    },
    { ticker: 'POWERGRID.NS',    companyName: 'Power Grid Corporation'  },
    { ticker: 'TORNTPOWER.NS',   companyName: 'Torrent Power'           },
    { ticker: 'THERMAX.NS',      companyName: 'Thermax'                 },
    { ticker: 'CESC.NS',         companyName: 'CESC Limited'            },
    { ticker: 'KEC.NS',          companyName: 'KEC International'       },
    { ticker: 'KALPATPOWR.NS',   companyName: 'Kalpataru Power Trans'   },
    { ticker: 'GPIL.NS',         companyName: 'Godawari Power & Ispat'  },
    { ticker: 'GREENPANEL.NS',   companyName: 'Greenpanel Industries'   },
    { ticker: 'ORIENTGREEN.NS',  companyName: 'Orient Green Power'      },
    { ticker: 'JSWENERGY.NS',    companyName: 'JSW Energy'               },
  ],
  consumer: [
    { ticker: 'HINDUNILVR.NS',   companyName: 'Hindustan Unilever'      },
    { ticker: 'ITC.NS',          companyName: 'ITC Limited'             },
    { ticker: 'NESTLEIND.NS',    companyName: 'Nestle India'            },
    { ticker: 'BRITANNIA.NS',    companyName: 'Britannia Industries'    },
    { ticker: 'DABUR.NS',        companyName: 'Dabur India'             },
    { ticker: 'MARICO.NS',       companyName: 'Marico'                  },
    { ticker: 'COLPAL.NS',       companyName: 'Colgate-Palmolive India' },
    { ticker: 'GODREJCP.NS',     companyName: 'Godrej Consumer Products'},
    { ticker: 'TATACONSUM.NS',   companyName: 'Tata Consumer Products'  },
    { ticker: 'EMAMILTD.NS',     companyName: 'Emami'                   },
    { ticker: 'JYOTHYLAB.NS',    companyName: 'Jyothy Labs'             },
    { ticker: 'VBL.NS',          companyName: 'Varun Beverages'         },
    { ticker: 'ZOMATO.NS',       companyName: 'Zomato'                  },
    { ticker: 'JUBLFOOD.NS',     companyName: 'Jubilant FoodWorks'      },
    { ticker: 'WESTLIFE.NS',     companyName: 'Westlife Foodworld'      },
    { ticker: 'DEVYANI.NS',      companyName: 'Devyani International'   },
    { ticker: 'SAPPHIRE.NS',     companyName: 'Sapphire Foods India'    },
    { ticker: 'NYKAA.NS',        companyName: 'FSN E-Commerce (Nykaa)' },
    { ticker: 'MANYAVAR.NS',     companyName: 'Vedant Fashions (Manyavar)'},
    { ticker: 'PATANJALI.NS',    companyName: 'Patanjali Foods'         },
  ],
  infrastructure: [
    { ticker: 'LT.NS',           companyName: 'Larsen & Toubro'         },
    { ticker: 'ADANIPORTS.NS',   companyName: 'Adani Ports & SEZ'       },
    { ticker: 'RVNL.NS',         companyName: 'Rail Vikas Nigam'        },
    { ticker: 'IRFC.NS',         companyName: 'Indian Railway Finance'  },
    { ticker: 'NBCC.NS',         companyName: 'NBCC (India)'            },
    { ticker: 'ENGINERSIN.NS',   companyName: 'Engineers India'         },
    { ticker: 'HGINFRA.NS',      companyName: 'H.G. Infra Engineering'  },
    { ticker: 'KNRCON.NS',       companyName: 'KNR Constructions'       },
    { ticker: 'IRB.NS',          companyName: 'IRB Infrastructure'      },
    { ticker: 'GMRINFRA.NS',     companyName: 'GMR Airports Infra'      },
    { ticker: 'ASHOKA.NS',       companyName: 'Ashoka Buildcon'         },
    { ticker: 'BEL.NS',          companyName: 'Bharat Electronics'      },
    { ticker: 'GRINFRA.NS',      companyName: 'G R Infraprojects'       },
    { ticker: 'PNCINFRA.NS',     companyName: 'PNC Infratech'           },
    { ticker: 'TITAGARH.NS',     companyName: 'Titagarh Rail Systems'   },
    { ticker: 'AHLUCONT.NS',     companyName: 'Ahluwalia Contracts'     },
    { ticker: 'HAL.NS',          companyName: 'Hindustan Aeronautics'   },
    { ticker: 'BDL.NS',          companyName: 'Bharat Dynamics'         },
    { ticker: 'RAILTEL.NS',      companyName: 'RailTel Corporation'     },
    { ticker: 'COCHINSHIP.NS',   companyName: 'Cochin Shipyard'         },
  ]
};

// ─── Static fallback data (used when live fetch returns null) ─────────────────
const STATIC_FALLBACK = {
  'RELIANCE.NS':   { currentPrice: 2850, high52Week: 3217, low52Week: 2220, marketCapCr: 1930000, peRatio: 24.5, earningsGrowth: 12, futureGrowth: 9,  socialSentiment: 8 },
  'TCS.NS':        { currentPrice: 3780, high52Week: 4592, low52Week: 3311, marketCapCr: 1370000, peRatio: 28.2, earningsGrowth: 10, futureGrowth: 8,  socialSentiment: 8 },
  'INFY.NS':       { currentPrice: 1620, high52Week: 1904, low52Week: 1358, marketCapCr:  675000, peRatio: 24.1, earningsGrowth: 9,  futureGrowth: 8,  socialSentiment: 7 },
  'HDFCBANK.NS':   { currentPrice: 1720, high52Week: 1880, low52Week: 1430, marketCapCr: 1310000, peRatio: 19.8, earningsGrowth: 18, futureGrowth: 9,  socialSentiment: 8 },
  'ICICIBANK.NS':  { currentPrice: 1380, high52Week: 1427, low52Week: 1014, marketCapCr:  970000, peRatio: 18.5, earningsGrowth: 22, futureGrowth: 9,  socialSentiment: 9 },
  'HINDUNILVR.NS': { currentPrice: 2350, high52Week: 2810, low52Week: 2200, marketCapCr:  551000, peRatio: 55.0, earningsGrowth: 7,  futureGrowth: 6,  socialSentiment: 7 },
  'MARUTI.NS':     { currentPrice: 12200,high52Week: 13680,low52Week: 9630, marketCapCr:  369000, peRatio: 26.3, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 8 },
  'SBIN.NS':       { currentPrice: 790,  high52Week: 912,  low52Week: 600,  marketCapCr:  704000, peRatio: 10.2, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'BAJAJFINSV.NS': { currentPrice: 1890, high52Week: 2030, low52Week: 1419, marketCapCr:  301000, peRatio: 22.1, earningsGrowth: 20, futureGrowth: 9,  socialSentiment: 8 },
  'TITAN.NS':      { currentPrice: 3200, high52Week: 3885, low52Week: 2775, marketCapCr:  284000, peRatio: 85.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 9 },
  'ASIANPAINT.NS': { currentPrice: 2470, high52Week: 3395, low52Week: 2025, marketCapCr:  236000, peRatio: 52.0, earningsGrowth: 5,  futureGrowth: 6,  socialSentiment: 7 },
  'NESTLEIND.NS':  { currentPrice: 2290, high52Week: 2778, low52Week: 2100, marketCapCr:  220000, peRatio: 70.0, earningsGrowth: 8,  futureGrowth: 6,  socialSentiment: 7 },
  'WIPRO.NS':      { currentPrice: 470,  high52Week: 577,  low52Week: 400,  marketCapCr:  244000, peRatio: 21.5, earningsGrowth: 7,  futureGrowth: 7,  socialSentiment: 6 },
  'ITC.NS':        { currentPrice: 430,  high52Week: 539,  low52Week: 399,  marketCapCr:  537000, peRatio: 27.0, earningsGrowth: 10, futureGrowth: 7,  socialSentiment: 7 },
  'KOTAKBANK.NS':  { currentPrice: 1950, high52Week: 2115, low52Week: 1544, marketCapCr:  388000, peRatio: 20.5, earningsGrowth: 15, futureGrowth: 8,  socialSentiment: 7 },
  'APOLLOHOSP.NS': { currentPrice: 6800, high52Week: 7545, low52Week: 5200, marketCapCr:   97000, peRatio: 68.0, earningsGrowth: 35, futureGrowth: 9,  socialSentiment: 9 },
  'ADANIPORTS.NS': { currentPrice: 1290, high52Week: 1608, low52Week: 980,  marketCapCr:  278000, peRatio: 22.0, earningsGrowth: 22, futureGrowth: 9,  socialSentiment: 7 },
  'LTTS.NS':       { currentPrice: 4850, high52Week: 6000, low52Week: 3900, marketCapCr:   51000, peRatio: 30.0, earningsGrowth: 18, futureGrowth: 9,  socialSentiment: 8 },
  'CHOLAFIN.NS':   { currentPrice: 1350, high52Week: 1652, low52Week: 950,  marketCapCr:  111000, peRatio: 25.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'MUTHOOTFIN.NS': { currentPrice: 1850, high52Week: 2228, low52Week: 1350, marketCapCr:   74000, peRatio: 14.5, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'JSWSTEEL.NS':   { currentPrice: 940,  high52Week: 1063, low52Week: 760,  marketCapCr:  230000, peRatio: 15.0, earningsGrowth: 12, futureGrowth: 8,  socialSentiment: 7 },
  'HINDALCO.NS':   { currentPrice: 680,  high52Week: 772,  low52Week: 490,  marketCapCr:  153000, peRatio: 11.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 7 },
  'INDIGO.NS':     { currentPrice: 4800, high52Week: 5017, low52Week: 3050, marketCapCr:  185000, peRatio: 17.0, earningsGrowth: 45, futureGrowth: 8,  socialSentiment: 8 },
  'GODREJPROP.NS': { currentPrice: 2450, high52Week: 3402, low52Week: 1762, marketCapCr:   68000, peRatio: 52.0, earningsGrowth: 28, futureGrowth: 8,  socialSentiment: 8 },
  'FEDERALBNK.NS': { currentPrice: 185,  high52Week: 213,  low52Week: 142,  marketCapCr:   45000, peRatio: 10.5, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'VOLTAS.NS':     { currentPrice: 1450, high52Week: 1800, low52Week: 1050, marketCapCr:   48000, peRatio: 55.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'PAGEIND.NS':    { currentPrice: 42000,high52Week: 48000,low52Week: 33000,marketCapCr:   46900, peRatio: 60.0, earningsGrowth: 14, futureGrowth: 7,  socialSentiment: 7 },
  'IDFCFIRSTB.NS': { currentPrice: 75,   high52Week: 92,   low52Week: 55,   marketCapCr:   55000, peRatio: 14.0, earningsGrowth: 40, futureGrowth: 9,  socialSentiment: 7 },
  'GAIL.NS':       { currentPrice: 205,  high52Week: 246,  low52Week: 155,  marketCapCr:  134000, peRatio: 12.5, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'SAIL.NS':       { currentPrice: 130,  high52Week: 175,  low52Week: 100,  marketCapCr:   53000, peRatio: 7.0,  earningsGrowth: 10, futureGrowth: 6,  socialSentiment: 6 },
  'JUSTDIAL.NS':   { currentPrice: 900,  high52Week: 1215, low52Week: 700,  marketCapCr:    7700, peRatio: 20.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'RADICO.NS':     { currentPrice: 1850, high52Week: 2327, low52Week: 1400, marketCapCr:   24600, peRatio: 50.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 7 },
  'AUBANK.NS':     { currentPrice: 620,  high52Week: 813,  low52Week: 490,  marketCapCr:   44000, peRatio: 22.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'KANSAINER.NS':  { currentPrice: 310,  high52Week: 395,  low52Week: 250,  marketCapCr:   16700, peRatio: 30.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 6 },
  'CENTURYTEX.NS': { currentPrice: 2100, high52Week: 2640, low52Week: 1450, marketCapCr:   23700, peRatio: 28.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'JKCEMENT.NS':   { currentPrice: 4200, high52Week: 5055, low52Week: 3200, marketCapCr:   32500, peRatio: 36.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'EDELWEISS.NS':  { currentPrice: 90,   high52Week: 122,  low52Week: 68,   marketCapCr:    8700, peRatio: 12.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 6 },
  'NATCOPHARM.NS': { currentPrice: 1450, high52Week: 1760, low52Week: 1100, marketCapCr:   26300, peRatio: 18.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'PIDILITIND.NS': { currentPrice: 2900, high52Week: 3440, low52Week: 2200, marketCapCr:  147000, peRatio: 75.0, earningsGrowth: 14, futureGrowth: 8,  socialSentiment: 8 },
  'DIVISLAB.NS':   { currentPrice: 5300, high52Week: 6235, low52Week: 3350, marketCapCr:  140000, peRatio: 67.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'HCLTECH.NS':    { currentPrice: 1580, high52Week: 1950, low52Week: 1235, marketCapCr:  428000, peRatio: 22.0, earningsGrowth: 12, futureGrowth: 8,  socialSentiment: 7 },
  'TECHM.NS':      { currentPrice: 1490, high52Week: 1807, low52Week: 1060, marketCapCr:  145000, peRatio: 28.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'PERSISTENT.NS': { currentPrice: 5200, high52Week: 6789, low52Week: 3600, marketCapCr:   80000, peRatio: 55.0, earningsGrowth: 35, futureGrowth: 9,  socialSentiment: 9 },
  'MPHASIS.NS':    { currentPrice: 2650, high52Week: 3098, low52Week: 1963, marketCapCr:   49500, peRatio: 32.0, earningsGrowth: 15, futureGrowth: 8,  socialSentiment: 7 },
  'COFORGE.NS':    { currentPrice: 7200, high52Week: 9575, low52Week: 4350, marketCapCr:   43500, peRatio: 48.0, earningsGrowth: 28, futureGrowth: 9,  socialSentiment: 8 },
  'KPITTECH.NS':   { currentPrice: 1350, high52Week: 1929, low52Week: 1120, marketCapCr:   36500, peRatio: 55.0, earningsGrowth: 40, futureGrowth: 9,  socialSentiment: 9 },
  'TATAELXSI.NS':  { currentPrice: 6800, high52Week: 9120, low52Week: 5300, marketCapCr:   42200, peRatio: 45.0, earningsGrowth: 22, futureGrowth: 9,  socialSentiment: 8 },
  'AXISBANK.NS':   { currentPrice: 1120, high52Week: 1340, low52Week: 955,  marketCapCr:  346000, peRatio: 15.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'IRFC.NS':       { currentPrice: 175,  high52Week: 229,  low52Week: 130,  marketCapCr:  229000, peRatio: 25.0, earningsGrowth: 18, futureGrowth: 9,  socialSentiment: 8 },
  'PFC.NS':        { currentPrice: 460,  high52Week: 580,  low52Week: 348,  marketCapCr:  152000, peRatio: 8.0,  earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'RECLTD.NS':     { currentPrice: 480,  high52Week: 654,  low52Week: 360,  marketCapCr:  126000, peRatio: 9.0,  earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'SUNPHARMA.NS':  { currentPrice: 1700, high52Week: 1960, low52Week: 1290, marketCapCr:  407000, peRatio: 36.0, earningsGrowth: 18, futureGrowth: 9,  socialSentiment: 8 },
  'CIPLA.NS':      { currentPrice: 1480, high52Week: 1694, low52Week: 1160, marketCapCr:  119000, peRatio: 26.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 8 },
  'DRREDDY.NS':    { currentPrice: 1250, high52Week: 1424, low52Week: 1050, marketCapCr:  104000, peRatio: 18.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 8 },
  'LUPIN.NS':      { currentPrice: 2150, high52Week: 2445, low52Week: 1440, marketCapCr:   97000, peRatio: 30.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'TORNTPHARM.NS': { currentPrice: 3200, high52Week: 3669, low52Week: 2350, marketCapCr:   54200, peRatio: 38.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'AUROPHARMA.NS': { currentPrice: 1200, high52Week: 1371, low52Week: 900,  marketCapCr:   70000, peRatio: 18.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'ALKEM.NS':      { currentPrice: 5200, high52Week: 6052, low52Week: 4200, marketCapCr:   62100, peRatio: 24.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 7 },
  'BIOCON.NS':     { currentPrice: 340,  high52Week: 395,  low52Week: 235,  marketCapCr:   40800, peRatio: 40.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'ADANIGREEN.NS': { currentPrice: 1700, high52Week: 2175, low52Week: 900,  marketCapCr:  268000, peRatio: 180.0,earningsGrowth: 60, futureGrowth: 10, socialSentiment: 8 },
  'TATAPOWER.NS':  { currentPrice: 390,  high52Week: 473,  low52Week: 290,  marketCapCr:  124000, peRatio: 30.0, earningsGrowth: 35, futureGrowth: 9,  socialSentiment: 9 },
  'NTPC.NS':       { currentPrice: 370,  high52Week: 448,  low52Week: 285,  marketCapCr:  359000, peRatio: 18.0, earningsGrowth: 15, futureGrowth: 8,  socialSentiment: 7 },
  'SUZLON.NS':     { currentPrice: 58,   high52Week: 86,   low52Week: 38,   marketCapCr:   79000, peRatio: 35.0, earningsGrowth: 80, futureGrowth: 10, socialSentiment: 9 },
  'INOXWIND.NS':   { currentPrice: 185,  high52Week: 248,  low52Week: 110,  marketCapCr:   24500, peRatio: 45.0, earningsGrowth: 100,futureGrowth: 10, socialSentiment: 8 },
  'WAAREEENER.NS': { currentPrice: 2450, high52Week: 3743, low52Week: 1400, marketCapCr:   69600, peRatio: 40.0, earningsGrowth: 85, futureGrowth: 10, socialSentiment: 9 },
  'SJVN.NS':       { currentPrice: 115,  high52Week: 170,  low52Week: 78,   marketCapCr:   45000, peRatio: 28.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'NHPC.NS':       { currentPrice: 92,   high52Week: 118,  low52Week: 64,   marketCapCr:   92000, peRatio: 20.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 6 },
  'BOROSIL.NS':    { currentPrice: 380,  high52Week: 520,  low52Week: 260,  marketCapCr:    7800, peRatio: 50.0, earningsGrowth: 40, futureGrowth: 9,  socialSentiment: 8 },
  'WEBSOL.NS':     { currentPrice: 1050, high52Week: 1614, low52Week: 580,  marketCapCr:    3500, peRatio: 55.0, earningsGrowth: 70, futureGrowth: 9,  socialSentiment: 8 },
  'BRITANNIA.NS':  { currentPrice: 5200, high52Week: 6185, low52Week: 4600, marketCapCr:  125000, peRatio: 52.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 7 },
  'DABUR.NS':      { currentPrice: 530,  high52Week: 660,  low52Week: 480,  marketCapCr:   94000, peRatio: 48.0, earningsGrowth: 9,  futureGrowth: 7,  socialSentiment: 7 },
  'MARICO.NS':     { currentPrice: 630,  high52Week: 725,  low52Week: 480,  marketCapCr:   81500, peRatio: 50.0, earningsGrowth: 10, futureGrowth: 7,  socialSentiment: 7 },
  'COLPAL.NS':     { currentPrice: 2800, high52Week: 3890, low52Week: 2300, marketCapCr:   76000, peRatio: 48.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 7 },
  'GODREJCP.NS':   { currentPrice: 1280, high52Week: 1591, low52Week: 1022, marketCapCr:  131000, peRatio: 55.0, earningsGrowth: 14, futureGrowth: 8,  socialSentiment: 7 },
  'TATACONSUM.NS': { currentPrice: 1050, high52Week: 1261, low52Week: 855,  marketCapCr:   97000, peRatio: 68.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 8 },
  'EMAMILTD.NS':   { currentPrice: 610,  high52Week: 800,  low52Week: 490,  marketCapCr:   27000, peRatio: 32.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 6 },
  'LT.NS':         { currentPrice: 3500, high52Week: 3963, low52Week: 2775, marketCapCr:  480000, peRatio: 28.0, earningsGrowth: 18, futureGrowth: 9,  socialSentiment: 9 },
  'RVNL.NS':       { currentPrice: 395,  high52Week: 647,  low52Week: 280,  marketCapCr:   82000, peRatio: 40.0, earningsGrowth: 25, futureGrowth: 9,  socialSentiment: 8 },
  'NBCC.NS':       { currentPrice: 95,   high52Week: 148,  low52Week: 68,   marketCapCr:   17000, peRatio: 32.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'ENGINERSIN.NS': { currentPrice: 215,  high52Week: 280,  low52Week: 155,  marketCapCr:   12000, peRatio: 22.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 7 },
  'HGINFRA.NS':    { currentPrice: 1550, high52Week: 1895, low52Week: 1100, marketCapCr:   11500, peRatio: 15.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'KNRCON.NS':     { currentPrice: 320,  high52Week: 415,  low52Week: 235,  marketCapCr:    9000, peRatio: 12.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'IRB.NS':        { currentPrice: 65,   high52Week: 80,   low52Week: 43,   marketCapCr:   39000, peRatio: 18.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'GMRINFRA.NS':   { currentPrice: 92,   high52Week: 120,  low52Week: 64,   marketCapCr:   55000, peRatio: 60.0, earningsGrowth: 35, futureGrowth: 9,  socialSentiment: 8 },
  'ASHOKA.NS':       { currentPrice: 230,  high52Week: 305,  low52Week: 170,  marketCapCr:    6400, peRatio: 14.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  // smallCap additions
  'DEEPAKNITRITE.NS': { currentPrice: 2200, high52Week: 2890, low52Week: 1700, marketCapCr:   30000, peRatio: 22.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 7 },
  'RBLBANK.NS':       { currentPrice: 220,  high52Week: 298,  low52Week: 148,  marketCapCr:   13000, peRatio: 12.0, earningsGrowth: 35, futureGrowth: 8,  socialSentiment: 6 },
  'SOBHA.NS':         { currentPrice: 1600, high52Week: 2082, low52Week: 1150, marketCapCr:   15000, peRatio: 30.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'BRIGADE.NS':       { currentPrice: 1200, high52Week: 1551, low52Week: 850,  marketCapCr:   16000, peRatio: 32.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  'AARTIIND.NS':      { currentPrice: 420,  high52Week: 720,  low52Week: 370,  marketCapCr:   15000, peRatio: 28.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'CAMS.NS':          { currentPrice: 3600, high52Week: 4398, low52Week: 2750, marketCapCr:   18700, peRatio: 42.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 8 },
  'LATENTVIEW.NS':    { currentPrice: 390,  high52Week: 590,  low52Week: 300,  marketCapCr:    7800, peRatio: 45.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'MAHINDCIE.NS':     { currentPrice: 520,  high52Week: 680,  low52Week: 380,  marketCapCr:    9700, peRatio: 18.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'SUDARSCHEM.NS':    { currentPrice: 680,  high52Week: 920,  low52Week: 540,  marketCapCr:    9000, peRatio: 32.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'WHIRLPOOL.NS':     { currentPrice: 1450, high52Week: 1950, low52Week: 1100, marketCapCr:   18400, peRatio: 40.0, earningsGrowth: 22, futureGrowth: 7,  socialSentiment: 6 },
  // tech additions
  'LTIM.NS':          { currentPrice: 5000, high52Week: 7000, low52Week: 4200, marketCapCr:  148000, peRatio: 30.0, earningsGrowth: 18, futureGrowth: 9,  socialSentiment: 8 },
  'OFSS.NS':          { currentPrice:12000, high52Week:13500, low52Week: 9500, marketCapCr:  104000, peRatio: 30.0, earningsGrowth: 14, futureGrowth: 8,  socialSentiment: 8 },
  'CYIENT.NS':        { currentPrice: 2200, high52Week: 2950, low52Week: 1600, marketCapCr:   24800, peRatio: 26.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 7 },
  'MASTEK.NS':        { currentPrice: 2800, high52Week: 3500, low52Week: 2100, marketCapCr:    8600, peRatio: 24.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'BIRLASOFT.NS':     { currentPrice: 600,  high52Week: 840,  low52Week: 450,  marketCapCr:   16600, peRatio: 22.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'ZENSAR.NS':        { currentPrice: 800,  high52Week: 1050, low52Week: 560,  marketCapCr:   18200, peRatio: 25.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 7 },
  'ROUTE.NS':         { currentPrice: 1600, high52Week: 2200, low52Week: 1200, marketCapCr:    9100, peRatio: 22.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'INTELLECT.NS':     { currentPrice: 900,  high52Week: 1200, low52Week: 640,  marketCapCr:   11700, peRatio: 30.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'DATAMATICS.NS':    { currentPrice: 680,  high52Week: 890,  low52Week: 490,  marketCapCr:    4400, peRatio: 20.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  // finance additions
  'BAJFINANCE.NS':    { currentPrice: 7000, high52Week: 9000, low52Week: 5750, marketCapCr:  423000, peRatio: 28.0, earningsGrowth: 28, futureGrowth: 9,  socialSentiment: 9 },
  'MANAPPURAM.NS':    { currentPrice: 220,  high52Week: 225,  low52Week: 140,  marketCapCr:   18700, peRatio: 8.0,  earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'M&MFIN.NS':        { currentPrice: 340,  high52Week: 410,  low52Week: 245,  marketCapCr:   42000, peRatio: 12.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'SUNDARMFIN.NS':    { currentPrice: 4800, high52Week: 5850, low52Week: 3500, marketCapCr:   53500, peRatio: 22.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 7 },
  'LICHSGFIN.NS':     { currentPrice: 660,  high52Week: 800,  low52Week: 480,  marketCapCr:   35300, peRatio: 8.0,  earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'BANDHANBNK.NS':    { currentPrice: 190,  high52Week: 245,  low52Week: 145,  marketCapCr:   30500, peRatio: 12.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  'CANBK.NS':         { currentPrice: 105,  high52Week: 145,  low52Week: 80,   marketCapCr:   95000, peRatio: 6.0,  earningsGrowth: 30, futureGrowth: 7,  socialSentiment: 6 },
  // healthcare additions
  'GRANULES.NS':      { currentPrice: 530,  high52Week: 680,  low52Week: 380,  marketCapCr:   13700, peRatio: 16.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'GLENMARK.NS':      { currentPrice: 1050, high52Week: 1345, low52Week: 800,  marketCapCr:   30000, peRatio: 20.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'ABBOTINDIA.NS':    { currentPrice:28000, high52Week:32000, low52Week:22000, marketCapCr:   59400, peRatio: 40.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 7 },
  'GLAXO.NS':         { currentPrice: 2500, high52Week: 3100, low52Week: 1900, marketCapCr:   21000, peRatio: 30.0, earningsGrowth: 14, futureGrowth: 7,  socialSentiment: 7 },
  'PFIZER.NS':        { currentPrice: 5500, high52Week: 6500, low52Week: 4200, marketCapCr:   25100, peRatio: 28.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 7 },
  'IPCALAB.NS':       { currentPrice: 1600, high52Week: 2100, low52Week: 1200, marketCapCr:   20300, peRatio: 22.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 7 },
  'LAURUSLABS.NS':    { currentPrice: 550,  high52Week: 760,  low52Week: 380,  marketCapCr:   29200, peRatio: 18.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'APLLTD.NS':        { currentPrice: 990,  high52Week: 1200, low52Week: 730,  marketCapCr:   11700, peRatio: 20.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'ERIS.NS':          { currentPrice: 1200, high52Week: 1500, low52Week: 900,  marketCapCr:   16200, peRatio: 22.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'METROPOLIS.NS':    { currentPrice: 1900, high52Week: 2600, low52Week: 1450, marketCapCr:    9700, peRatio: 35.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  // renewable additions
  'POWERGRID.NS':     { currentPrice: 340,  high52Week: 410,  low52Week: 255,  marketCapCr:  317000, peRatio: 16.0, earningsGrowth: 10, futureGrowth: 7,  socialSentiment: 7 },
  'TORNTPOWER.NS':    { currentPrice: 1400, high52Week: 1700, low52Week: 1000, marketCapCr:   67000, peRatio: 22.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'THERMAX.NS':       { currentPrice: 3500, high52Week: 4500, low52Week: 2700, marketCapCr:   41500, peRatio: 50.0, earningsGrowth: 25, futureGrowth: 9,  socialSentiment: 8 },
  'CESC.NS':          { currentPrice: 200,  high52Week: 256,  low52Week: 148,  marketCapCr:   26500, peRatio: 10.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'KEC.NS':           { currentPrice: 1000, high52Week: 1300, low52Week: 700,  marketCapCr:   25700, peRatio: 25.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'KALPATPOWR.NS':    { currentPrice: 900,  high52Week: 1180, low52Week: 650,  marketCapCr:   15100, peRatio: 20.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'GPIL.NS':          { currentPrice: 800,  high52Week: 1100, low52Week: 550,  marketCapCr:   12500, peRatio: 10.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'GREENPANEL.NS':    { currentPrice: 280,  high52Week: 440,  low52Week: 200,  marketCapCr:    6800, peRatio: 18.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'ORIENTGREEN.NS':   { currentPrice: 25,   high52Week: 38,   low52Week: 16,   marketCapCr:    2800, peRatio: 35.0, earningsGrowth: 50, futureGrowth: 8,  socialSentiment: 6 },
  'JSWENERGY.NS':     { currentPrice: 680,  high52Week: 820,  low52Week: 480,  marketCapCr:  111000, peRatio: 30.0, earningsGrowth: 25, futureGrowth: 9,  socialSentiment: 8 },
  // consumer additions
  'JYOTHYLAB.NS':     { currentPrice: 600,  high52Week: 730,  low52Week: 420,  marketCapCr:   22100, peRatio: 38.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'VBL.NS':           { currentPrice: 530,  high52Week: 680,  low52Week: 395,  marketCapCr:  143000, peRatio: 55.0, earningsGrowth: 28, futureGrowth: 9,  socialSentiment: 8 },
  'ZOMATO.NS':        { currentPrice: 250,  high52Week: 305,  low52Week: 140,  marketCapCr:  220000, peRatio: 200.0,earningsGrowth: 300,futureGrowth: 10, socialSentiment: 9 },
  'JUBLFOOD.NS':      { currentPrice: 650,  high52Week: 810,  low52Week: 490,  marketCapCr:   43000, peRatio: 60.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 8 },
  'WESTLIFE.NS':      { currentPrice: 900,  high52Week: 1140, low52Week: 680,  marketCapCr:   14100, peRatio: 55.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'DEVYANI.NS':       { currentPrice: 185,  high52Week: 230,  low52Week: 140,  marketCapCr:   22200, peRatio: 70.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  'SAPPHIRE.NS':      { currentPrice: 340,  high52Week: 430,  low52Week: 250,  marketCapCr:    9100, peRatio: 50.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'NYKAA.NS':         { currentPrice: 175,  high52Week: 230,  low52Week: 120,  marketCapCr:   50000, peRatio: 150.0,earningsGrowth: 80, futureGrowth: 9,  socialSentiment: 8 },
  'MANYAVAR.NS':      { currentPrice: 1300, high52Week: 1700, low52Week: 1000, marketCapCr:   33400, peRatio: 35.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 8 },
  'PATANJALI.NS':     { currentPrice: 1600, high52Week: 2090, low52Week: 1100, marketCapCr:   43300, peRatio: 28.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  // infrastructure additions
  'BEL.NS':           { currentPrice: 330,  high52Week: 415,  low52Week: 205,  marketCapCr:  241000, peRatio: 40.0, earningsGrowth: 35, futureGrowth: 9,  socialSentiment: 9 },
  'GRINFRA.NS':       { currentPrice: 2000, high52Week: 2700, low52Week: 1500, marketCapCr:   19500, peRatio: 22.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'PNCINFRA.NS':      { currentPrice: 500,  high52Week: 670,  low52Week: 350,  marketCapCr:   12800, peRatio: 18.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'TITAGARH.NS':      { currentPrice: 1400, high52Week: 1920, low52Week: 950,  marketCapCr:   13500, peRatio: 35.0, earningsGrowth: 40, futureGrowth: 9,  socialSentiment: 8 },
  'AHLUCONT.NS':      { currentPrice: 1200, high52Week: 1550, low52Week: 850,  marketCapCr:    7700, peRatio: 20.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'HAL.NS':           { currentPrice: 4200, high52Week: 5674, low52Week: 2900, marketCapCr:  280000, peRatio: 38.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 9 },
  'BDL.NS':           { currentPrice: 1200, high52Week: 1794, low52Week: 850,  marketCapCr:   34600, peRatio: 35.0, earningsGrowth: 28, futureGrowth: 9,  socialSentiment: 8 },
  'RAILTEL.NS':       { currentPrice: 390,  high52Week: 617,  low52Week: 290,  marketCapCr:   12500, peRatio: 30.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'COCHINSHIP.NS':    { currentPrice: 1800, high52Week: 2650, low52Week: 1200, marketCapCr:   23500, peRatio: 25.0, earningsGrowth: 35, futureGrowth: 9,  socialSentiment: 8 },
  // MAHAGENCO not listed; placeholder already handled
};

// ─── Quality scoring (0-100 pts total) ────────────────────────────────────────
const scoreStock = (stock) => {
  let score = 0;

  // 1. Market Trend — 52W position (0-20 pts)
  const range = stock.high52Week - stock.low52Week;
  let marketTrend = 0;
  if (range > 0) {
    const pos = (stock.currentPrice - stock.low52Week) / range;
    if (pos >= 0.3 && pos <= 0.7) marketTrend = 20;
    else if (pos < 0.3) marketTrend = pos * 40;
    else marketTrend = (1 - pos) * 40;
  } else {
    marketTrend = 10;
  }
  score += marketTrend;

  // 2. Valuation — PE ratio (0-25 pts)
  let valuation = 0;
  if (stock.peRatio && stock.peRatio > 0) {
    if      (stock.peRatio < 15) valuation = 25;
    else if (stock.peRatio < 25) valuation = 20;
    else if (stock.peRatio < 40) valuation = 14;
    else if (stock.peRatio < 60) valuation = 8;
    else                         valuation = 3;
  } else {
    valuation = 10;
  }
  score += valuation;

  // 3. Earnings Growth (0-20 pts)
  const eg = stock.earningsGrowth ?? 0;
  let earnings = 0;
  if      (eg >= 50) earnings = 20;
  else if (eg >= 25) earnings = 16;
  else if (eg >= 15) earnings = 12;
  else if (eg >= 8)  earnings = 8;
  else               earnings = 4;
  score += earnings;

  // 4. Future Growth (0-20 pts)
  const futureGrowthScore = Math.min((stock.futureGrowth ?? 5) * 2, 20);
  score += futureGrowthScore;

  // 5. Social/Sentiment (0-15 pts)
  const sentimentScore = Math.min((stock.socialSentiment ?? 5) * 1.5, 15);
  score += sentimentScore;

  return {
    total: Math.round(score * 100) / 100,
    marketTrend:   Math.round(marketTrend        * 100) / 100,
    valuation:     Math.round(valuation          * 100) / 100,
    earnings:      Math.round(earnings           * 100) / 100,
    futureGrowth:  Math.round(futureGrowthScore  * 100) / 100,
    sentiment:     Math.round(sentimentScore     * 100) / 100,
  };
};

// ─── Compute quality-proportional weights (min 5%, sum = 100%) ────────────────
const computeQualityWeights = (sortedStocks) => {
  const totalScore = sortedStocks.reduce((sum, s) => sum + (s.score || 1), 0);
  let weights = sortedStocks.map(s =>
    totalScore > 0 ? Math.round((s.score / totalScore) * 1000) / 10 : 10
  );
  const MIN_WEIGHT = 5;
  let excess = 0;
  weights = weights.map(w => {
    if (w < MIN_WEIGHT) { excess += MIN_WEIGHT - w; return MIN_WEIGHT; }
    return w;
  });
  if (excess > 0) {
    for (let i = 0; i < weights.length && excess > 0; i++) {
      if (weights[i] > MIN_WEIGHT) {
        const reduction = Math.min(weights[i] - MIN_WEIGHT, excess);
        weights[i] = Math.round((weights[i] - reduction) * 10) / 10;
        excess = Math.round((excess - reduction) * 10) / 10;
      }
    }
  }
  const weightSum = Math.round(weights.reduce((s, w) => s + w, 0) * 10) / 10;
  const diff = Math.round((100 - weightSum) * 10) / 10;
  if (diff !== 0) weights[0] = Math.round((weights[0] + diff) * 10) / 10;
  return weights;
};

// ─── Compute quantity of shares per stock based on quality weight ──────────────
const computeQuantities = (sortedStocks, weights, investmentAmount = 100000) => {
  return sortedStocks.map((stock, idx) => {
    const alloc = (weights[idx] / 100) * investmentAmount;
    const price = stock.currentPrice || 1;
    const qty = Math.max(1, Math.floor(alloc / price));
    return qty;
  });
};

const buildReason = (stock, rank, scores) => {
  const pe = stock.peRatio ? `PE ${stock.peRatio.toFixed(1)}` : 'PE N/A';
  const eg = stock.earningsGrowth != null ? `${stock.earningsGrowth.toFixed(1)}%` : 'N/A';
  return `Rank #${rank} | ${pe} | EPS growth ${eg} | Future growth ${(stock.futureGrowth ?? 5).toFixed(1)}/10 | Sentiment ${(stock.socialSentiment ?? 5).toFixed(1)}/10`;
};

const getCategoryFromName = (name) => {
  if (name.includes('Midcap'))     return 'midCap';
  if (name.includes('Smallcap'))   return 'smallCap';
  if (name.includes('Tech'))       return 'tech';
  if (name.includes('Finance'))    return 'finance';
  if (name.includes('Healthcare')) return 'healthcare';
  if (name.includes('Renewable'))  return 'renewable';
  if (name.includes('Consumer'))   return 'consumer';
  if (name.includes('Infra'))      return 'infrastructure';
  return 'largeCap';
};

const mergeWithFallback = (universeDefs, liveResults) => {
  return universeDefs.map((def, idx) => {
    const live = liveResults[idx];
    const fallback = STATIC_FALLBACK[def.ticker] || {};

    if (live && live.currentPrice > 0) {
      // Supplement missing fundamentals from static fallback (v8 chart lacks PE/EPS)
      return {
        ...live,
        peRatio:         live.peRatio         ?? fallback.peRatio         ?? null,
        earningsGrowth:  live.earningsGrowth  ?? fallback.earningsGrowth  ?? null,
        futureGrowth:    live.futureGrowth     ?? fallback.futureGrowth    ?? 5,
        socialSentiment: live.socialSentiment  ?? fallback.socialSentiment ?? 5,
      };
    }

    if (fallback.currentPrice) {
      const range = fallback.high52Week - fallback.low52Week;
      const socialSentiment = range > 0
        ? Math.max(0, Math.min(10, ((fallback.currentPrice - fallback.low52Week) / range) * 10))
        : fallback.socialSentiment;
      return {
        ticker:          def.ticker,
        companyName:     def.companyName,
        currentPrice:    fallback.currentPrice,
        high52Week:      fallback.high52Week,
        low52Week:       fallback.low52Week,
        marketCap:       fallback.marketCapCr * 1e7,
        marketCapCr:     fallback.marketCapCr,
        peRatio:         fallback.peRatio,
        earningsGrowth:  fallback.earningsGrowth,
        revenueGrowth:   null,
        futureGrowth:    fallback.futureGrowth,
        socialSentiment: socialSentiment,
        lastUpdated:     new Date(),
      };
    }

    console.warn(`[rebalanceService] No data for ${def.ticker}, skipping`);
    return null;
  }).filter(Boolean);
};

// ─── selectTopStocks (sync helper kept for backward compat) ───────────────────
const selectTopStocks = (category) => {
  const universe = STOCK_UNIVERSE[category] || STOCK_UNIVERSE.largeCap;
  const scored = universe.map(def => {
    const fb = STATIC_FALLBACK[def.ticker] || {};
    const stock = { ...def, ...fb };
    const scores = scoreStock(stock);
    return { ...stock, score: scores.total, qualityScores: scores };
  });
  scored.sort((a, b) => b.score - a.score);
  const top15 = scored.slice(0, 15);
  const qualityWeights = computeQualityWeights(top15);
  const quantities = computeQuantities(top15, qualityWeights, 100000);
  return top15.map((stock, idx) => ({
    ticker:        stock.ticker,
    companyName:   stock.companyName,
    symbol:        stock.ticker,
    currentPrice:  stock.currentPrice,
    high52Week:    stock.high52Week,
    low52Week:     stock.low52Week,
    marketCap:     stock.marketCapCr ? `${stock.marketCapCr} Cr` : null,
    peRatio:       stock.peRatio,
    earningsGrowth: stock.earningsGrowth,
    futureGrowth:  stock.futureGrowth,
    socialSentiment: stock.socialSentiment != null ? Number(stock.socialSentiment.toFixed ? stock.socialSentiment.toFixed(2) : stock.socialSentiment) : null,
    weight:        qualityWeights[idx],
    quantity:      quantities[idx],
    reason:        buildReason(stock, idx + 1, stock.qualityScores),
    status:        'active',
    addedDate:     new Date(),
    score:         stock.score,
    qualityScores: stock.qualityScores,
  }));
};

// ─── Main rebalance function ───────────────────────────────────────────────────
const rebalanceBasket = async (basketId, manualTrigger = false) => {
  try {
    const basket = await Basket.findById(basketId);
    if (!basket) throw new Error('Basket not found');

    // Use stored categoryKey if set (for user-created baskets), else derive from name
    const category     = basket.categoryKey || getCategoryFromName(basket.name);
    const universeDefs = STOCK_UNIVERSE[category] || STOCK_UNIVERSE.largeCap;
    const tickers      = universeDefs.map(d => d.ticker);

    let enrichedStocks;
    try {
      const liveResults = await getEnrichedUniverseData(tickers);
      enrichedStocks    = mergeWithFallback(universeDefs, liveResults);
    } catch (fetchErr) {
      console.warn(`[rebalanceService] Live fetch failed, using full static fallback: ${fetchErr.message}`);
      enrichedStocks = mergeWithFallback(universeDefs, universeDefs.map(() => null));
    }

    const scored = enrichedStocks.map(stock => {
      const scores = scoreStock(stock);
      return { ...stock, score: scores.total, qualityScores: scores };
    });
    scored.sort((a, b) => b.score - a.score);
    const top15 = scored.slice(0, 15);
    const qualityWeights = computeQualityWeights(top15);
    const quantities = computeQuantities(top15, qualityWeights, 100000);

    const newStocks = top15.map((stock, idx) => ({
      ticker:          stock.ticker,
      companyName:     stock.companyName,
      symbol:          stock.ticker,
      currentPrice:    stock.currentPrice,
      high52Week:      stock.high52Week,
      low52Week:       stock.low52Week,
      marketCap:       stock.marketCapCr ? `${stock.marketCapCr} Cr` : null,
      peRatio:         stock.peRatio,
      earningsGrowth:  stock.earningsGrowth,
      revenueGrowth:   stock.revenueGrowth,
      futureGrowth:    stock.futureGrowth,
      socialSentiment: stock.socialSentiment != null ? Number(stock.socialSentiment.toFixed(2)) : null,
      weight:          qualityWeights[idx],
      quantity:        quantities[idx],
      reason:          buildReason(stock, idx + 1, stock.qualityScores),
      status:          'active',
      addedDate:       basket.stocks.find(b => b.ticker === stock.ticker)?.addedDate || new Date(),
      score:           stock.score,
      qualityScores:   stock.qualityScores,
    }));

    const changes = { added: [], removed: [], partialRemoved: [] };
    for (const old of basket.stocks) {
      const newMatch = newStocks.find(s => s.ticker === old.ticker);
      if (!newMatch) {
        changes.removed.push({ ticker: old.ticker, companyName: old.companyName, quantity: old.quantity, salePrice: old.currentPrice });
      } else if (newMatch.quantity < old.quantity) {
        changes.partialRemoved.push({ ticker: old.ticker, companyName: old.companyName, quantityRemoved: old.quantity - newMatch.quantity, reason: 'Quality score decreased' });
      }
    }
    for (const ns of newStocks) {
      if (!basket.stocks.find(s => s.ticker === ns.ticker))
        changes.added.push({ ticker: ns.ticker, companyName: ns.companyName, quantity: ns.quantity, reason: ns.reason });
    }

    basket.stocks            = newStocks;
    basket.totalValue        = Math.ceil(newStocks.reduce((sum, s) => sum + ((s.currentPrice || 0) * (s.quantity || 1)), 0));
    basket.minimumInvestment = basket.totalValue;
    basket.lastRebalanceDate = new Date();
    basket.nextRebalanceDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await basket.save();

    try {
      await new RebalanceHistory({
        basketId,
        changes,
        reason: manualTrigger ? 'Manual rebalance' : 'Auto rebalance (30-day)',
        manualTrigger,
        emailsSent: 0,
      }).save();
    } catch (e) { console.warn('History save failed:', e.message); }

    if (basket.subscribers?.length) {
      for (const email of basket.subscribers) {
        try { await emailService.sendRebalanceNotification(email, basket, changes); }
        catch (e) { console.warn('Email failed:', e.message); }
      }
    }

    return { success: true, basket, changes, emailsSent: basket.subscribers.length };
  } catch (err) {
    console.error('Rebalance error:', err);
    throw err;
  }
};

const getRebalanceSummary = async (basketId) => {
  const basket = await Basket.findById(basketId);
  let history = [];
  try { history = await RebalanceHistory.find({ basketId }).sort({ createdAt: -1 }).limit(10); }
  catch (e) { console.warn('History fetch failed:', e.message); }
  return {
    basket: {
      name:              basket.name,
      lastRebalanceDate: basket.lastRebalanceDate,
      nextRebalanceDate: basket.nextRebalanceDate,
      minimumInvestment: basket.minimumInvestment,
    },
    recentChanges: history,
  };
};

module.exports = { rebalanceBasket, selectTopStocks, getRebalanceSummary, STATIC_FALLBACK, buildReason, STOCK_UNIVERSE };