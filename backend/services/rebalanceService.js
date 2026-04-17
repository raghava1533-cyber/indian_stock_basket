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
    { ticker: 'LT.NS',         companyName: 'Larsen & Toubro'           },
    { ticker: 'AXISBANK.NS',   companyName: 'Axis Bank'                 },
    { ticker: 'BAJFINANCE.NS', companyName: 'Bajaj Finance'             },
    { ticker: 'HCLTECH.NS',    companyName: 'HCL Technologies'          },
    { ticker: 'NTPC.NS',       companyName: 'NTPC'                      },
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
    { ticker: 'TRENT.NS',      companyName: 'Trent Limited'            },
    { ticker: 'PERSISTENT.NS', companyName: 'Persistent Systems'       },
    { ticker: 'COFORGE.NS',    companyName: 'Coforge'                  },
    { ticker: 'PIIND.NS',      companyName: 'PI Industries'            },
    { ticker: 'POLYCAB.NS',    companyName: 'Polycab India'            },
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
  ],
  auto: [
    { ticker: 'MARUTI.NS',       companyName: 'Maruti Suzuki'           },
    { ticker: 'TATAMOTORS.NS',   companyName: 'Tata Motors'             },
    { ticker: 'M&M.NS',          companyName: 'Mahindra & Mahindra'     },
    { ticker: 'BAJAJ-AUTO.NS',   companyName: 'Bajaj Auto'              },
    { ticker: 'HEROMOTOCO.NS',   companyName: 'Hero MotoCorp'           },
    { ticker: 'EICHERMOT.NS',    companyName: 'Eicher Motors'           },
    { ticker: 'ASHOKLEY.NS',     companyName: 'Ashok Leyland'           },
    { ticker: 'TVSMOTOR.NS',     companyName: 'TVS Motor Company'       },
    { ticker: 'MOTHERSON.NS',    companyName: 'Motherson Sumi Wiring'   },
    { ticker: 'BOSCHLTD.NS',     companyName: 'Bosch India'             },
    { ticker: 'MRF.NS',          companyName: 'MRF'                     },
    { ticker: 'APOLLOTYRE.NS',   companyName: 'Apollo Tyres'            },
    { ticker: 'BALKRISIND.NS',   companyName: 'Balkrishna Industries'   },
    { ticker: 'EXIDEIND.NS',     companyName: 'Exide Industries'        },
    { ticker: 'BHARATFORG.NS',   companyName: 'Bharat Forge'            },
    { ticker: 'SONACOMS.NS',     companyName: 'Sona BLW Precision'      },
    { ticker: 'TIINDIA.NS',      companyName: 'Tube Investments India'  },
    { ticker: 'SWARAJENG.NS',    companyName: 'Swaraj Engines'          },
    { ticker: 'CEATLTD.NS',      companyName: 'CEAT'                    },
    { ticker: 'FORCEMOT.NS',     companyName: 'Force Motors'            },
  ],
  metals: [
    { ticker: 'TATASTEEL.NS',    companyName: 'Tata Steel'              },
    { ticker: 'JSWSTEEL.NS',     companyName: 'JSW Steel'               },
    { ticker: 'HINDALCO.NS',     companyName: 'Hindalco Industries'     },
    { ticker: 'VEDL.NS',         companyName: 'Vedanta Limited'         },
    { ticker: 'COALINDIA.NS',    companyName: 'Coal India'              },
    { ticker: 'NMDC.NS',         companyName: 'NMDC'                    },
    { ticker: 'SAIL.NS',         companyName: 'Steel Authority of India'},
    { ticker: 'NATIONALUM.NS',   companyName: 'National Aluminium'      },
    { ticker: 'HINDCOPPER.NS',   companyName: 'Hindustan Copper'        },
    { ticker: 'MOIL.NS',         companyName: 'MOIL'                    },
    { ticker: 'APLAPOLLO.NS',    companyName: 'APL Apollo Tubes'        },
    { ticker: 'RATNAMANI.NS',    companyName: 'Ratnamani Metals'        },
    { ticker: 'WELCORP.NS',      companyName: 'Welspun Corp'            },
    { ticker: 'JINDALSTEL.NS',   companyName: 'Jindal Steel & Power'    },
    { ticker: 'GPIL.NS',         companyName: 'Godawari Power & Ispat'  },
    { ticker: 'MISHRA.NS',       companyName: 'Mishra Dhatu Nigam'      },
    { ticker: 'KIOCL.NS',        companyName: 'KIOCL Limited'           },
    { ticker: 'GRAVITA.NS',      companyName: 'Gravita India'           },
    { ticker: 'JSWISPL.NS',      companyName: 'JSW Ispat Special'       },
    { ticker: 'TINPLATE.NS',     companyName: 'Tinplate Company India'  },
  ],
  telecom: [
    { ticker: 'BHARTIARTL.NS',   companyName: 'Bharti Airtel'           },
    { ticker: 'IDEA.NS',         companyName: 'Vodafone Idea'           },
    { ticker: 'TATACOMM.NS',     companyName: 'Tata Communications'     },
    { ticker: 'RAILTEL.NS',      companyName: 'RailTel Corporation'     },
    { ticker: 'ROUTE.NS',        companyName: 'Route Mobile'            },
    { ticker: 'STERLITE.NS',     companyName: 'Sterlite Technologies'   },
    { ticker: 'HFCL.NS',         companyName: 'HFCL'                    },
    { ticker: 'TEJAS.NS',        companyName: 'Tejas Networks'          },
    { ticker: 'INDUSTOWER.NS',   companyName: 'Indus Towers'            },
    { ticker: 'TTML.NS',         companyName: 'Tata Teleservices Maha'  },
    { ticker: 'GTLINFRA.NS',     companyName: 'GTL Infrastructure'      },
    { ticker: 'ITI.NS',          companyName: 'ITI Limited'             },
    { ticker: 'ONMOBILE.NS',     companyName: 'OnMobile Global'         },
    { ticker: 'TANLA.NS',        companyName: 'Tanla Platforms'         },
    { ticker: 'AFFLE.NS',        companyName: 'Affle India'             },
    { ticker: 'INTELLECT.NS',    companyName: 'Intellect Design Arena'  },
    { ticker: 'LATENTVIEW.NS',   companyName: 'LatentView Analytics'    },
    { ticker: 'MASTEK.NS',       companyName: 'Mastek'                  },
    { ticker: 'CYIENT.NS',       companyName: 'Cyient'                  },
    { ticker: 'DATAMATICS.NS',   companyName: 'Datamatics Global'       },
  ],
  psu: [
    { ticker: 'SBIN.NS',         companyName: 'State Bank of India'     },
    { ticker: 'NTPC.NS',         companyName: 'NTPC'                    },
    { ticker: 'COALINDIA.NS',    companyName: 'Coal India'              },
    { ticker: 'POWERGRID.NS',    companyName: 'Power Grid Corporation'  },
    { ticker: 'ONGC.NS',         companyName: 'Oil & Natural Gas Corp'  },
    { ticker: 'IOC.NS',          companyName: 'Indian Oil Corporation'  },
    { ticker: 'BPCL.NS',         companyName: 'Bharat Petroleum'        },
    { ticker: 'HAL.NS',          companyName: 'Hindustan Aeronautics'   },
    { ticker: 'BEL.NS',          companyName: 'Bharat Electronics'      },
    { ticker: 'IRFC.NS',         companyName: 'Indian Railway Finance'  },
    { ticker: 'GAIL.NS',         companyName: 'GAIL India'              },
    { ticker: 'NHPC.NS',         companyName: 'NHPC Limited'            },
    { ticker: 'NMDC.NS',         companyName: 'NMDC'                    },
    { ticker: 'RVNL.NS',         companyName: 'Rail Vikas Nigam'        },
    { ticker: 'PFC.NS',          companyName: 'Power Finance Corporation'},
    { ticker: 'RECLTD.NS',       companyName: 'REC Limited'             },
    { ticker: 'SJVN.NS',         companyName: 'SJVN Limited'            },
    { ticker: 'NBCC.NS',         companyName: 'NBCC (India)'            },
    { ticker: 'CONCOR.NS',       companyName: 'Container Corp of India' },
    { ticker: 'CANBK.NS',        companyName: 'Canara Bank'             },
  ],
  realty: [
    { ticker: 'GODREJPROP.NS',   companyName: 'Godrej Properties'       },
    { ticker: 'DLF.NS',          companyName: 'DLF Limited'             },
    { ticker: 'OBEROIRLTY.NS',   companyName: 'Oberoi Realty'           },
    { ticker: 'PRESTIGE.NS',     companyName: 'Prestige Estates'        },
    { ticker: 'BRIGADE.NS',      companyName: 'Brigade Enterprises'     },
    { ticker: 'PHOENIXLTD.NS',   companyName: 'Phoenix Mills'           },
    { ticker: 'SOBHA.NS',        companyName: 'Sobha Ltd'               },
    { ticker: 'LODHA.NS',        companyName: 'Macrotech Developers'    },
    { ticker: 'SUNTECK.NS',      companyName: 'Sunteck Realty'          },
    { ticker: 'MAHLIFE.NS',      companyName: 'Mahindra Lifespace'      },
    { ticker: 'KOLTEPATIL.NS',   companyName: 'Kolte-Patil Developers'  },
    { ticker: 'IBREALEST.NS',    companyName: 'Indiabulls Real Estate'  },
    { ticker: 'RAYMOND.NS',      companyName: 'Raymond'                 },
    { ticker: 'ANANTRAJ.NS',     companyName: 'Anant Raj'               },
    { ticker: 'ARVIND.NS',       companyName: 'Arvind SmartSpaces'      },
    { ticker: 'HEMIPROP.NS',     companyName: 'Hemisphere Properties'   },
    { ticker: 'PURVA.NS',        companyName: 'Puravankara'             },
    { ticker: 'GPIL.NS',         companyName: 'Godawari Power & Ispat'  },
    { ticker: 'JKCEMENT.NS',     companyName: 'JK Cement'               },
    { ticker: 'CENTURYTEX.NS',   companyName: 'Century Textiles'        },
  ],
  chemicals: [
    { ticker: 'SRF.NS',           companyName: 'SRF Limited'             },
    { ticker: 'AARTIIND.NS',      companyName: 'Aarti Industries'        },
    { ticker: 'DEEPAKNITRITE.NS', companyName: 'Deepak Nitrite'          },
    { ticker: 'NAVINFLUOR.NS',    companyName: 'Navin Fluorine'          },
    { ticker: 'CLEANSCI.NS',      companyName: 'Clean Science & Tech'    },
    { ticker: 'FLUOROCHEM.NS',    companyName: 'Gujarat Fluorochemicals' },
    { ticker: 'ATUL.NS',          companyName: 'Atul Limited'            },
    { ticker: 'BASF.NS',          companyName: 'BASF India'              },
    { ticker: 'VINATIORGA.NS',    companyName: 'Vinati Organics'         },
    { ticker: 'LXCHEM.NS',        companyName: 'Laxmi Organic'           },
    { ticker: 'ALKYLAMINE.NS',    companyName: 'Alkyl Amines'            },
    { ticker: 'FINEORG.NS',       companyName: 'Fine Organic Industries' },
    { ticker: 'TATACHEM.NS',      companyName: 'Tata Chemicals'          },
    { ticker: 'PIDILITIND.NS',    companyName: 'Pidilite Industries'     },
    { ticker: 'UPL.NS',           companyName: 'UPL Limited'             },
    { ticker: 'SUDARSCHEM.NS',    companyName: 'Sudarshan Chemical'      },
    { ticker: 'HIMADRI.NS',       companyName: 'Himadri Speciality'      },
    { ticker: 'ROSSARI.NS',       companyName: 'Rossari Biotech'         },
    { ticker: 'GALAXYSURF.NS',    companyName: 'Galaxy Surfactants'      },
    { ticker: 'ANUPAM.NS',        companyName: 'Anupam Rasayan'          },
  ],
  cement: [
    { ticker: 'ULTRACEMCO.NS',    companyName: 'UltraTech Cement'        },
    { ticker: 'SHREECEM.NS',      companyName: 'Shree Cement'            },
    { ticker: 'AMBUJACEM.NS',     companyName: 'Ambuja Cements'          },
    { ticker: 'ACC.NS',           companyName: 'ACC Limited'             },
    { ticker: 'DALBHARAT.NS',     companyName: 'Dalmia Bharat'           },
    { ticker: 'RAMCOCEM.NS',      companyName: 'Ramco Cements'           },
    { ticker: 'JKCEMENT.NS',      companyName: 'JK Cement'               },
    { ticker: 'BIRLACORPN.NS',    companyName: 'Birla Corporation'       },
    { ticker: 'INDIACEM.NS',      companyName: 'India Cements'           },
    { ticker: 'JKLAKSHMI.NS',     companyName: 'JK Lakshmi Cement'       },
    { ticker: 'ORIENTCEM.NS',     companyName: 'Orient Cement'           },
    { ticker: 'STARCEMENT.NS',    companyName: 'Star Cement'             },
    { ticker: 'NUVOCO.NS',        companyName: 'Nuvoco Vistas'           },
    { ticker: 'HEIDELBERG.NS',    companyName: 'Heidelberg Cement India' },
    { ticker: 'PRISMJOHNS.NS',    companyName: 'Prism Johnson'           },
    { ticker: 'SAGCEM.NS',        companyName: 'Sagar Cements'           },
    { ticker: 'NCLIND.NS',        companyName: 'NCL Industries'          },
    { ticker: 'KCP.NS',           companyName: 'KCP Limited'             },
    { ticker: 'DECCANCEM.NS',     companyName: 'Deccan Cements'          },
    { ticker: 'KESORAMIND.NS',    companyName: 'Kesoram Industries'      },
  ],
  oilgas: [
    { ticker: 'RELIANCE.NS',      companyName: 'Reliance Industries'     },
    { ticker: 'ONGC.NS',          companyName: 'Oil & Natural Gas Corp'  },
    { ticker: 'IOC.NS',           companyName: 'Indian Oil Corp'         },
    { ticker: 'BPCL.NS',          companyName: 'Bharat Petroleum'        },
    { ticker: 'GAIL.NS',          companyName: 'GAIL India'              },
    { ticker: 'HINDPETRO.NS',     companyName: 'Hindustan Petroleum'     },
    { ticker: 'PETRONET.NS',      companyName: 'Petronet LNG'            },
    { ticker: 'GUJGASLTD.NS',     companyName: 'Gujarat Gas'             },
    { ticker: 'MGL.NS',           companyName: 'Mahanagar Gas'           },
    { ticker: 'GSPL.NS',          companyName: 'Gujarat State Petronet'  },
    { ticker: 'IGL.NS',           companyName: 'Indraprastha Gas'        },
    { ticker: 'OIL.NS',           companyName: 'Oil India'               },
    { ticker: 'MRPL.NS',          companyName: 'MRPL'                    },
    { ticker: 'CHENNPETRO.NS',    companyName: 'Chennai Petroleum'       },
    { ticker: 'CASTROLIND.NS',    companyName: 'Castrol India'           },
    { ticker: 'GULFOILLUB.NS',    companyName: 'Gulf Oil Lubricants'     },
    { ticker: 'AEGISCHEM.NS',     companyName: 'Aegis Logistics'         },
    { ticker: 'ATGL.NS',          companyName: 'Adani Total Gas'         },
    { ticker: 'GSFC.NS',          companyName: 'Gujarat State Fertilizer'},
    { ticker: 'SUPPETRO.NS',      companyName: 'Supreme Petrochem'       },
  ],
  fertilizer: [
    { ticker: 'UPL.NS',           companyName: 'UPL Limited'             },
    { ticker: 'COROMANDEL.NS',    companyName: 'Coromandel International'},
    { ticker: 'CHAMBLFERT.NS',    companyName: 'Chambal Fertilizers'     },
    { ticker: 'GNFC.NS',          companyName: 'Gujarat Narmada Fert'    },
    { ticker: 'NFL.NS',           companyName: 'National Fertilizers'    },
    { ticker: 'RCF.NS',           companyName: 'Rashtriya Chemicals'     },
    { ticker: 'DEEPAKFERT.NS',    companyName: 'Deepak Fertilizers'      },
    { ticker: 'FACT.NS',          companyName: 'Fertilizers & Chemicals' },
    { ticker: 'PARADEEP.NS',      companyName: 'Paradeep Phosphates'     },
    { ticker: 'BAYERCROP.NS',     companyName: 'Bayer CropScience'       },
    { ticker: 'RALLIS.NS',        companyName: 'Rallis India'            },
    { ticker: 'DHANUKA.NS',       companyName: 'Dhanuka Agritech'        },
    { ticker: 'SUMICHEM.NS',      companyName: 'Sumitomo Chemical India' },
    { ticker: 'INSECTICID.NS',    companyName: 'Insecticides India'      },
    { ticker: 'SHARDACROP.NS',    companyName: 'Sharda Cropchem'         },
    { ticker: 'HERANBA.NS',       companyName: 'Heranba Industries'      },
    { ticker: 'ASTEC.NS',         companyName: 'Astec Lifesciences'      },
    { ticker: 'KSCL.NS',          companyName: 'Kaveri Seed Company'     },
    { ticker: 'PIIND.NS',         companyName: 'PI Industries'           },
    { ticker: 'GSFC.NS',          companyName: 'Gujarat State Fertilizer'},
  ],
  defence: [
    { ticker: 'HAL.NS',           companyName: 'Hindustan Aeronautics'   },
    { ticker: 'BEL.NS',           companyName: 'Bharat Electronics'      },
    { ticker: 'BDL.NS',           companyName: 'Bharat Dynamics'         },
    { ticker: 'MAZDOCK.NS',       companyName: 'Mazagon Dock Ship'       },
    { ticker: 'COCHINSHIP.NS',    companyName: 'Cochin Shipyard'         },
    { ticker: 'GRSE.NS',          companyName: 'Garden Reach Shipbuilders'},
    { ticker: 'DATAPATTNS.NS',    companyName: 'Data Patterns'           },
    { ticker: 'ZENTEC.NS',        companyName: 'Zen Technologies'        },
    { ticker: 'SOLARINDS.NS',     companyName: 'Solar Industries'        },
    { ticker: 'PARASDEFEN.NS',    companyName: 'Paras Defence'           },
    { ticker: 'ASTRAMICRO.NS',    companyName: 'Astra Microwave'         },
    { ticker: 'BEML.NS',          companyName: 'BEML Limited'            },
    { ticker: 'MIDHANI.NS',       companyName: 'Mishra Dhatu Nigam'      },
    { ticker: 'IDEAFORGE.NS',     companyName: 'ideaForge Technology'    },
    { ticker: 'PREMEXPLN.NS',     companyName: 'Premier Explosives'      },
    { ticker: 'BHEL.NS',          companyName: 'Bharat Heavy Electricals'},
    { ticker: 'BHARATFORG.NS',    companyName: 'Bharat Forge'            },
    { ticker: 'LT.NS',            companyName: 'Larsen & Toubro'         },
    { ticker: 'TITAGARH.NS',      companyName: 'Titagarh Rail Systems'   },
    { ticker: 'AVANTEL.NS',       companyName: 'Avantel Limited'         },
  ],
  media: [
    { ticker: 'ZEEL.NS',          companyName: 'Zee Entertainment'       },
    { ticker: 'SUNTV.NS',         companyName: 'Sun TV Network'          },
    { ticker: 'PVRINOX.NS',       companyName: 'PVR INOX'               },
    { ticker: 'SAREGAMA.NS',      companyName: 'Saregama India'          },
    { ticker: 'TIPSINDLTD.NS',    companyName: 'Tips Industries'         },
    { ticker: 'NETWORK18.NS',     companyName: 'Network18 Media'         },
    { ticker: 'TV18BRDCST.NS',    companyName: 'TV18 Broadcast'          },
    { ticker: 'NAZARA.NS',        companyName: 'Nazara Technologies'     },
    { ticker: 'DISHTV.NS',        companyName: 'Dish TV India'           },
    { ticker: 'HATHWAY.NS',       companyName: 'Hathway Cable'           },
    { ticker: 'DEN.NS',           companyName: 'DEN Networks'            },
    { ticker: 'SHEMAROO.NS',      companyName: 'Shemaroo Entertainment'  },
    { ticker: 'BALAJITELE.NS',    companyName: 'Balaji Telefilms'        },
    { ticker: 'DBCORP.NS',        companyName: 'D.B. Corp'               },
    { ticker: 'JAGRAN.NS',        companyName: 'Jagran Prakashan'        },
    { ticker: 'HTMEDIA.NS',       companyName: 'HT Media'               },
    { ticker: 'NAVNETEDUL.NS',    companyName: 'Navneet Education'       },
    { ticker: 'NDTV.NS',          companyName: 'NDTV'                    },
    { ticker: 'SANDESH.NS',       companyName: 'The Sandesh'             },
    { ticker: 'INFIBEAM.NS',      companyName: 'Infibeam Avenues'        },
  ],
  textile: [
    { ticker: 'PAGEIND.NS',       companyName: 'Page Industries'         },
    { ticker: 'TRENT.NS',         companyName: 'Trent Limited'           },
    { ticker: 'RAYMOND.NS',       companyName: 'Raymond'                 },
    { ticker: 'KPRMILL.NS',       companyName: 'KPR Mill'                },
    { ticker: 'LUXIND.NS',        companyName: 'Lux Industries'          },
    { ticker: 'GOKALDAS.NS',      companyName: 'Gokaldas Exports'        },
    { ticker: 'TRIDENT.NS',       companyName: 'Trident Limited'         },
    { ticker: 'RSWM.NS',          companyName: 'RSWM Limited'            },
    { ticker: 'HIMATSEIDE.NS',    companyName: 'Himatsingka Seide'       },
    { ticker: 'ICIL.NS',          companyName: 'Indo Count Industries'   },
    { ticker: 'WELSPUNLIV.NS',    companyName: 'Welspun Living'          },
    { ticker: 'DOLLAR.NS',        companyName: 'Dollar Industries'       },
    { ticker: 'KITEX.NS',         companyName: 'Kitex Garments'          },
    { ticker: 'ARVIND.NS',        companyName: 'Arvind Limited'          },
    { ticker: 'VTL.NS',           companyName: 'Vardhman Textiles'       },
    { ticker: 'TCNSCLOTH.NS',     companyName: 'TCNS Clothing'           },
    { ticker: 'BSLLTD.NS',        companyName: 'BSL Limited'             },
    { ticker: 'SIYARAM.NS',       companyName: 'Siyaram Silk Mills'      },
    { ticker: 'MANYAVAR.NS',      companyName: 'Vedant Fashions'         },
    { ticker: 'NYKAA.NS',         companyName: 'FSN E-Commerce'          },
  ],
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
  // largeCap additions
  'LT.NS':            { currentPrice: 3600, high52Week: 4000, low52Week: 2800, marketCapCr:  495000, peRatio: 32.0, earningsGrowth: 15, futureGrowth: 8,  socialSentiment: 8 },
  'BAJFINANCE.NS':    { currentPrice: 6800, high52Week: 8200, low52Week: 5800, marketCapCr:  420000, peRatio: 28.0, earningsGrowth: 25, futureGrowth: 9,  socialSentiment: 9 },
  // midCap additions
  'TRENT.NS':         { currentPrice: 6500, high52Week: 8050, low52Week: 3900, marketCapCr:  231000, peRatio: 120.0,earningsGrowth: 50, futureGrowth: 9,  socialSentiment: 9 },
  'PIIND.NS':         { currentPrice: 3800, high52Week: 4500, low52Week: 2900, marketCapCr:   57700, peRatio: 30.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'POLYCAB.NS':       { currentPrice: 6200, high52Week: 7600, low52Week: 4700, marketCapCr:   93000, peRatio: 45.0, earningsGrowth: 28, futureGrowth: 9,  socialSentiment: 8 },
  // auto sector
  'TATAMOTORS.NS':    { currentPrice: 780,  high52Week: 1080, low52Week: 620,  marketCapCr:  287000, peRatio: 8.0,  earningsGrowth: 90, futureGrowth: 9,  socialSentiment: 9 },
  'M&M.NS':           { currentPrice: 2800, high52Week: 3250, low52Week: 1760, marketCapCr:  348000, peRatio: 22.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 9 },
  'BAJAJ-AUTO.NS':    { currentPrice: 9200, high52Week: 12770,low52Week: 6800, marketCapCr:  258000, peRatio: 30.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 8 },
  'HEROMOTOCO.NS':    { currentPrice: 5200, high52Week: 6200, low52Week: 3700, marketCapCr:  104000, peRatio: 22.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 7 },
  'EICHERMOT.NS':     { currentPrice: 4600, high52Week: 5100, low52Week: 3400, marketCapCr:  126000, peRatio: 28.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 8 },
  'ASHOKLEY.NS':      { currentPrice: 225,  high52Week: 265,  low52Week: 160,  marketCapCr:   66100, peRatio: 25.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'TVSMOTOR.NS':      { currentPrice: 2400, high52Week: 2960, low52Week: 1700, marketCapCr:  114000, peRatio: 55.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'MOTHERSON.NS':     { currentPrice: 160,  high52Week: 220,  low52Week: 110,  marketCapCr:  109000, peRatio: 32.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'BOSCHLTD.NS':      { currentPrice: 33000,high52Week: 39500,low52Week: 24500,marketCapCr:   97300, peRatio: 38.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 7 },
  'MRF.NS':           { currentPrice: 125000,high52Week:155000,low52Week: 98000,marketCapCr:   53000, peRatio: 25.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'APOLLOTYRE.NS':    { currentPrice: 490,  high52Week: 580,  low52Week: 370,  marketCapCr:   31100, peRatio: 22.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 7 },
  'BALKRISIND.NS':    { currentPrice: 2700, high52Week: 3300, low52Week: 2100, marketCapCr:   52100, peRatio: 28.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 7 },
  'EXIDEIND.NS':      { currentPrice: 440,  high52Week: 600,  low52Week: 300,  marketCapCr:   37400, peRatio: 30.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'BHARATFORG.NS':    { currentPrice: 1400, high52Week: 1800, low52Week: 1000, marketCapCr:   65200, peRatio: 45.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 8 },
  'SONACOMS.NS':      { currentPrice: 630,  high52Week: 780,  low52Week: 450,  marketCapCr:   36800, peRatio: 55.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'TIINDIA.NS':       { currentPrice: 4200, high52Week: 5100, low52Week: 3100, marketCapCr:   79600, peRatio: 55.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'SWARAJENG.NS':     { currentPrice: 3000, high52Week: 3500, low52Week: 2200, marketCapCr:    3600, peRatio: 20.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'CEATLTD.NS':       { currentPrice: 2800, high52Week: 3200, low52Week: 2000, marketCapCr:   11300, peRatio: 25.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 7 },
  'FORCEMOT.NS':      { currentPrice: 7500, high52Week: 10000,low52Week: 5400, marketCapCr:    9900, peRatio: 18.0, earningsGrowth: 28, futureGrowth: 8,  socialSentiment: 7 },
  // metals sector
  'TATASTEEL.NS':     { currentPrice: 155,  high52Week: 185,  low52Week: 120,  marketCapCr:  192000, peRatio: 12.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 7 },
  'VEDL.NS':          { currentPrice: 460,  high52Week: 527,  low52Week: 310,  marketCapCr:  171000, peRatio: 12.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'COALINDIA.NS':     { currentPrice: 430,  high52Week: 543,  low52Week: 350,  marketCapCr:  264000, peRatio: 8.0,  earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'NMDC.NS':          { currentPrice: 250,  high52Week: 310,  low52Week: 190,  marketCapCr:   73200, peRatio: 10.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'NATIONALUM.NS':    { currentPrice: 185,  high52Week: 252,  low52Week: 130,  marketCapCr:   33900, peRatio: 15.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 6 },
  'HINDCOPPER.NS':    { currentPrice: 310,  high52Week: 425,  low52Week: 210,  marketCapCr:   29800, peRatio: 20.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  'MOIL.NS':          { currentPrice: 400,  high52Week: 550,  low52Week: 300,  marketCapCr:   10700, peRatio: 12.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'APLAPOLLO.NS':     { currentPrice: 1700, high52Week: 2000, low52Week: 1200, marketCapCr:   47600, peRatio: 35.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'RATNAMANI.NS':     { currentPrice: 3200, high52Week: 3800, low52Week: 2400, marketCapCr:   22500, peRatio: 28.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'WELCORP.NS':       { currentPrice: 700,  high52Week: 850,  low52Week: 500,  marketCapCr:   18300, peRatio: 12.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'JINDALSTEL.NS':    { currentPrice: 920,  high52Week: 1100, low52Week: 680,  marketCapCr:   91500, peRatio: 14.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'MISHRA.NS':        { currentPrice: 350,  high52Week: 500,  low52Week: 250,  marketCapCr:    6500, peRatio: 18.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'KIOCL.NS':         { currentPrice: 350,  high52Week: 530,  low52Week: 250,  marketCapCr:   21400, peRatio: 15.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 6 },
  'GRAVITA.NS':       { currentPrice: 2200, high52Week: 2700, low52Week: 1500, marketCapCr:   15100, peRatio: 35.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  'JSWISPL.NS':       { currentPrice: 60,   high52Week: 80,   low52Week: 40,   marketCapCr:    3200, peRatio: 10.0, earningsGrowth: 15, futureGrowth: 6,  socialSentiment: 5 },
  'TINPLATE.NS':      { currentPrice: 450,  high52Week: 550,  low52Week: 300,  marketCapCr:    4400, peRatio: 15.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  // telecom sector
  'BHARTIARTL.NS':    { currentPrice: 1700, high52Week: 1900, low52Week: 1230, marketCapCr:  980000, peRatio: 70.0, earningsGrowth: 40, futureGrowth: 9,  socialSentiment: 9 },
  'IDEA.NS':          { currentPrice: 14,   high52Week: 19,   low52Week: 8,    marketCapCr:   69500, peRatio: -1,   earningsGrowth: 0,  futureGrowth: 5,  socialSentiment: 5 },
  'TATACOMM.NS':      { currentPrice: 1900, high52Week: 2280, low52Week: 1550, marketCapCr:   54200, peRatio: 25.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'STERLITE.NS':      { currentPrice: 150,  high52Week: 230,  low52Week: 100,  marketCapCr:    5900, peRatio: 25.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'HFCL.NS':          { currentPrice: 110,  high52Week: 170,  low52Week: 75,   marketCapCr:   15400, peRatio: 30.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'TEJAS.NS':         { currentPrice: 1100, high52Week: 1760, low52Week: 800,  marketCapCr:   19600, peRatio: 80.0, earningsGrowth: 50, futureGrowth: 9,  socialSentiment: 8 },
  'INDUSTOWER.NS':    { currentPrice: 400,  high52Week: 500,  low52Week: 250,  marketCapCr:  107000, peRatio: 15.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'TTML.NS':          { currentPrice: 80,   high52Week: 120,  low52Week: 55,   marketCapCr:   15600, peRatio: -1,   earningsGrowth: 0,  futureGrowth: 5,  socialSentiment: 5 },
  'GTLINFRA.NS':      { currentPrice: 2,    high52Week: 4,    low52Week: 1,    marketCapCr:     240, peRatio: -1,   earningsGrowth: 0,  futureGrowth: 3,  socialSentiment: 3 },
  'ITI.NS':           { currentPrice: 300,  high52Week: 480,  low52Week: 200,  marketCapCr:   27500, peRatio: 60.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  'ONMOBILE.NS':      { currentPrice: 100,  high52Week: 140,  low52Week: 70,   marketCapCr:    1000, peRatio: 15.0, earningsGrowth: 10, futureGrowth: 6,  socialSentiment: 5 },
  'TANLA.NS':         { currentPrice: 900,  high52Week: 1300, low52Week: 700,  marketCapCr:   12200, peRatio: 20.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'AFFLE.NS':         { currentPrice: 1600, high52Week: 1880, low52Week: 1050, marketCapCr:   22800, peRatio: 50.0, earningsGrowth: 35, futureGrowth: 9,  socialSentiment: 8 },
  // psu sector
  'ONGC.NS':          { currentPrice: 260,  high52Week: 345,  low52Week: 195,  marketCapCr:  327000, peRatio: 6.0,  earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'IOC.NS':           { currentPrice: 160,  high52Week: 200,  low52Week: 120,  marketCapCr:  226000, peRatio: 8.0,  earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 6 },
  'BPCL.NS':          { currentPrice: 320,  high52Week: 385,  low52Week: 240,  marketCapCr:  139000, peRatio: 7.0,  earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'CONCOR.NS':        { currentPrice: 750,  high52Week: 1095, low52Week: 600,  marketCapCr:   45600, peRatio: 30.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  // realty sector
  'DLF.NS':           { currentPrice: 780,  high52Week: 960,  low52Week: 600,  marketCapCr:  193000, peRatio: 55.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'OBEROIRLTY.NS':    { currentPrice: 1900, high52Week: 2220, low52Week: 1300, marketCapCr:   69200, peRatio: 30.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 8 },
  'PRESTIGE.NS':      { currentPrice: 1600, high52Week: 2020, low52Week: 1100, marketCapCr:   64000, peRatio: 40.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'PHOENIXLTD.NS':    { currentPrice: 1800, high52Week: 2100, low52Week: 1300, marketCapCr:   32000, peRatio: 28.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'LODHA.NS':         { currentPrice: 1300, high52Week: 1680, low52Week: 900,  marketCapCr:  125000, peRatio: 35.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'SUNTECK.NS':       { currentPrice: 500,  high52Week: 680,  low52Week: 350,  marketCapCr:    7200, peRatio: 22.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'MAHLIFE.NS':       { currentPrice: 600,  high52Week: 750,  low52Week: 400,  marketCapCr:    9200, peRatio: 25.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 6 },
  'KOLTEPATIL.NS':    { currentPrice: 600,  high52Week: 800,  low52Week: 400,  marketCapCr:    4600, peRatio: 18.0, earningsGrowth: 22, futureGrowth: 7,  socialSentiment: 6 },
  'IBREALEST.NS':     { currentPrice: 150,  high52Week: 200,  low52Week: 100,  marketCapCr:    6700, peRatio: 15.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 5 },
  'ANANTRAJ.NS':      { currentPrice: 350,  high52Week: 480,  low52Week: 200,  marketCapCr:   10200, peRatio: 20.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  // chemicals sector
  'SRF.NS':           { currentPrice: 2400, high52Week: 2850, low52Week: 1900, marketCapCr:   71200, peRatio: 35.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 8 },
  'NAVINFLUOR.NS':    { currentPrice: 3600, high52Week: 4400, low52Week: 2800, marketCapCr:   17900, peRatio: 30.0, earningsGrowth: 15, futureGrowth: 8,  socialSentiment: 7 },
  'CLEANSCI.NS':      { currentPrice: 1500, high52Week: 1900, low52Week: 1100, marketCapCr:   15900, peRatio: 50.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'FLUOROCHEM.NS':    { currentPrice: 3500, high52Week: 4400, low52Week: 2600, marketCapCr:   38500, peRatio: 35.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'ATUL.NS':          { currentPrice: 6500, high52Week: 8100, low52Week: 5200, marketCapCr:   19200, peRatio: 28.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'BASF.NS':          { currentPrice: 3200, high52Week: 4300, low52Week: 2500, marketCapCr:   13800, peRatio: 22.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'VINATIORGA.NS':    { currentPrice: 1800, high52Week: 2200, low52Week: 1400, marketCapCr:   18500, peRatio: 55.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 7 },
  'LXCHEM.NS':        { currentPrice: 260,  high52Week: 380,  low52Week: 200,  marketCapCr:    6900, peRatio: 35.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'ALKYLAMINE.NS':    { currentPrice: 2200, high52Week: 2900, low52Week: 1700, marketCapCr:   11200, peRatio: 38.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'FINEORG.NS':       { currentPrice: 4500, high52Week: 5800, low52Week: 3600, marketCapCr:   13800, peRatio: 40.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'TATACHEM.NS':      { currentPrice: 1100, high52Week: 1300, low52Week: 850,  marketCapCr:   28000, peRatio: 12.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 7 },
  'UPL.NS':           { currentPrice: 500,  high52Week: 800,  low52Week: 400,  marketCapCr:   38000, peRatio: 15.0, earningsGrowth: 10, futureGrowth: 7,  socialSentiment: 6 },
  'HIMADRI.NS':       { currentPrice: 500,  high52Week: 650,  low52Week: 300,  marketCapCr:   20900, peRatio: 25.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  'ROSSARI.NS':       { currentPrice: 800,  high52Week: 1000, low52Week: 600,  marketCapCr:    4500, peRatio: 30.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 6 },
  'GALAXYSURF.NS':    { currentPrice: 2800, high52Week: 3400, low52Week: 2200, marketCapCr:    9900, peRatio: 32.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'ANUPAM.NS':        { currentPrice: 900,  high52Week: 1200, low52Week: 650,  marketCapCr:    9600, peRatio: 35.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  // cement sector
  'ULTRACEMCO.NS':    { currentPrice: 10800,high52Week: 12100,low52Week: 8400, marketCapCr:  312000, peRatio: 35.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 8 },
  'SHREECEM.NS':      { currentPrice: 25000,high52Week: 29000,low52Week: 22000,marketCapCr:   90000, peRatio: 30.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'AMBUJACEM.NS':     { currentPrice: 600,  high52Week: 720,  low52Week: 460,  marketCapCr:  147000, peRatio: 18.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'ACC.NS':           { currentPrice: 2300, high52Week: 2800, low52Week: 1800, marketCapCr:   43200, peRatio: 15.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 7 },
  'DALBHARAT.NS':     { currentPrice: 1900, high52Week: 2500, low52Week: 1500, marketCapCr:   35600, peRatio: 20.0, earningsGrowth: 18, futureGrowth: 8,  socialSentiment: 7 },
  'RAMCOCEM.NS':      { currentPrice: 850,  high52Week: 1100, low52Week: 700,  marketCapCr:   20100, peRatio: 22.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'BIRLACORPN.NS':    { currentPrice: 1400, high52Week: 1800, low52Week: 1000, marketCapCr:   10800, peRatio: 25.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 6 },
  'INDIACEM.NS':      { currentPrice: 320,  high52Week: 420,  low52Week: 240,  marketCapCr:    9900, peRatio: 30.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 5 },
  'JKLAKSHMI.NS':     { currentPrice: 800,  high52Week: 1000, low52Week: 600,  marketCapCr:    9400, peRatio: 18.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'ORIENTCEM.NS':     { currentPrice: 230,  high52Week: 310,  low52Week: 170,  marketCapCr:    4700, peRatio: 20.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 5 },
  'STARCEMENT.NS':    { currentPrice: 200,  high52Week: 260,  low52Week: 150,  marketCapCr:    4900, peRatio: 25.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 5 },
  'NUVOCO.NS':        { currentPrice: 350,  high52Week: 450,  low52Week: 270,  marketCapCr:   12500, peRatio: 30.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'HEIDELBERG.NS':    { currentPrice: 200,  high52Week: 260,  low52Week: 150,  marketCapCr:    4500, peRatio: 20.0, earningsGrowth: 15, futureGrowth: 6,  socialSentiment: 5 },
  'PRISMJOHNS.NS':    { currentPrice: 180,  high52Week: 240,  low52Week: 130,  marketCapCr:    4600, peRatio: 22.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 5 },
  'SAGCEM.NS':        { currentPrice: 250,  high52Week: 350,  low52Week: 180,  marketCapCr:    3800, peRatio: 15.0, earningsGrowth: 10, futureGrowth: 6,  socialSentiment: 5 },
  'NCLIND.NS':        { currentPrice: 200,  high52Week: 280,  low52Week: 140,  marketCapCr:    2800, peRatio: 12.0, earningsGrowth: 15, futureGrowth: 6,  socialSentiment: 5 },
  'KCP.NS':           { currentPrice: 200,  high52Week: 280,  low52Week: 150,  marketCapCr:    2500, peRatio: 15.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 5 },
  'DECCANCEM.NS':     { currentPrice: 700,  high52Week: 900,  low52Week: 500,  marketCapCr:    1500, peRatio: 12.0, earningsGrowth: 10, futureGrowth: 5,  socialSentiment: 4 },
  'KESORAMIND.NS':    { currentPrice: 180,  high52Week: 280,  low52Week: 100,  marketCapCr:    2300, peRatio: -1,   earningsGrowth: 0,  futureGrowth: 5,  socialSentiment: 4 },
  // oilgas sector
  'HINDPETRO.NS':     { currentPrice: 400,  high52Week: 470,  low52Week: 280,  marketCapCr:   85400, peRatio: 8.0,  earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'PETRONET.NS':      { currentPrice: 340,  high52Week: 400,  low52Week: 260,  marketCapCr:   51000, peRatio: 12.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'GUJGASLTD.NS':     { currentPrice: 500,  high52Week: 650,  low52Week: 380,  marketCapCr:   34400, peRatio: 25.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 7 },
  'MGL.NS':           { currentPrice: 1200, high52Week: 1550, low52Week: 950,  marketCapCr:   11800, peRatio: 15.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'GSPL.NS':          { currentPrice: 350,  high52Week: 440,  low52Week: 270,  marketCapCr:   19700, peRatio: 12.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 6 },
  'IGL.NS':           { currentPrice: 420,  high52Week: 550,  low52Week: 320,  marketCapCr:   29400, peRatio: 20.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'OIL.NS':           { currentPrice: 520,  high52Week: 680,  low52Week: 380,  marketCapCr:   84500, peRatio: 8.0,  earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'MRPL.NS':          { currentPrice: 190,  high52Week: 260,  low52Week: 140,  marketCapCr:   33200, peRatio: 10.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 6 },
  'CHENNPETRO.NS':    { currentPrice: 600,  high52Week: 850,  low52Week: 400,  marketCapCr:    8900, peRatio: 6.0,  earningsGrowth: 25, futureGrowth: 7,  socialSentiment: 6 },
  'CASTROLIND.NS':    { currentPrice: 200,  high52Week: 280,  low52Week: 150,  marketCapCr:   19800, peRatio: 18.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 6 },
  'GULFOILLUB.NS':    { currentPrice: 950,  high52Week: 1200, low52Week: 750,  marketCapCr:    9400, peRatio: 20.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'AEGISCHEM.NS':     { currentPrice: 700,  high52Week: 900,  low52Week: 500,  marketCapCr:   23400, peRatio: 25.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'ATGL.NS':          { currentPrice: 700,  high52Week: 1050, low52Week: 500,  marketCapCr:   77000, peRatio: 60.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'GSFC.NS':          { currentPrice: 250,  high52Week: 320,  low52Week: 180,  marketCapCr:    9900, peRatio: 10.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 5 },
  'SUPPETRO.NS':      { currentPrice: 450,  high52Week: 600,  low52Week: 320,  marketCapCr:    7200, peRatio: 15.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  // fertilizer sector
  'COROMANDEL.NS':    { currentPrice: 1700, high52Week: 2100, low52Week: 1300, marketCapCr:   50000, peRatio: 20.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 8 },
  'CHAMBLFERT.NS':    { currentPrice: 500,  high52Week: 640,  low52Week: 380,  marketCapCr:   20800, peRatio: 12.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 7 },
  'GNFC.NS':          { currentPrice: 700,  high52Week: 900,  low52Week: 500,  marketCapCr:   10900, peRatio: 10.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'NFL.NS':           { currentPrice: 100,  high52Week: 140,  low52Week: 70,   marketCapCr:    4900, peRatio: 15.0, earningsGrowth: 10, futureGrowth: 6,  socialSentiment: 5 },
  'RCF.NS':           { currentPrice: 150,  high52Week: 200,  low52Week: 100,  marketCapCr:    8300, peRatio: 12.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 5 },
  'DEEPAKFERT.NS':    { currentPrice: 550,  high52Week: 750,  low52Week: 400,  marketCapCr:    6900, peRatio: 8.0,  earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'FACT.NS':          { currentPrice: 800,  high52Week: 1100, low52Week: 550,  marketCapCr:   12600, peRatio: 15.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'PARADEEP.NS':      { currentPrice: 100,  high52Week: 140,  low52Week: 70,   marketCapCr:    8100, peRatio: 10.0, earningsGrowth: 15, futureGrowth: 6,  socialSentiment: 5 },
  'BAYERCROP.NS':     { currentPrice: 5500, high52Week: 7000, low52Week: 4500, marketCapCr:   24700, peRatio: 28.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 7 },
  'RALLIS.NS':        { currentPrice: 280,  high52Week: 350,  low52Week: 210,  marketCapCr:    5400, peRatio: 25.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 6 },
  'DHANUKA.NS':       { currentPrice: 1500, high52Week: 2000, low52Week: 1100, marketCapCr:    7200, peRatio: 18.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'SUMICHEM.NS':      { currentPrice: 500,  high52Week: 650,  low52Week: 370,  marketCapCr:   25000, peRatio: 30.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 7 },
  'INSECTICID.NS':    { currentPrice: 700,  high52Week: 900,  low52Week: 500,  marketCapCr:    4600, peRatio: 15.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 5 },
  'SHARDACROP.NS':    { currentPrice: 500,  high52Week: 700,  low52Week: 350,  marketCapCr:    5100, peRatio: 18.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 5 },
  'HERANBA.NS':       { currentPrice: 450,  high52Week: 600,  low52Week: 300,  marketCapCr:    1800, peRatio: 12.0, earningsGrowth: 10, futureGrowth: 6,  socialSentiment: 5 },
  'ASTEC.NS':         { currentPrice: 1600, high52Week: 2200, low52Week: 1100, marketCapCr:    3200, peRatio: 22.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'KSCL.NS':          { currentPrice: 700,  high52Week: 1000, low52Week: 500,  marketCapCr:    4200, peRatio: 15.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 6 },
  // defence sector
  'MAZDOCK.NS':       { currentPrice: 4000, high52Week: 5500, low52Week: 2500, marketCapCr:   80500, peRatio: 40.0, earningsGrowth: 35, futureGrowth: 9,  socialSentiment: 9 },
  'GRSE.NS':          { currentPrice: 1700, high52Week: 2600, low52Week: 1100, marketCapCr:   19500, peRatio: 35.0, earningsGrowth: 30, futureGrowth: 9,  socialSentiment: 8 },
  'DATAPATTNS.NS':    { currentPrice: 2200, high52Week: 3500, low52Week: 1500, marketCapCr:   12600, peRatio: 50.0, earningsGrowth: 35, futureGrowth: 9,  socialSentiment: 8 },
  'ZENTEC.NS':        { currentPrice: 1700, high52Week: 2500, low52Week: 1000, marketCapCr:   13500, peRatio: 55.0, earningsGrowth: 40, futureGrowth: 9,  socialSentiment: 8 },
  'SOLARINDS.NS':     { currentPrice: 9000, high52Week: 12000,low52Week: 6500, marketCapCr:   81000, peRatio: 55.0, earningsGrowth: 25, futureGrowth: 9,  socialSentiment: 8 },
  'PARASDEFEN.NS':    { currentPrice: 1100, high52Week: 1600, low52Week: 700,  marketCapCr:    4200, peRatio: 45.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  'ASTRAMICRO.NS':    { currentPrice: 600,  high52Week: 900,  low52Week: 400,  marketCapCr:    5200, peRatio: 35.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'BEML.NS':          { currentPrice: 3700, high52Week: 5600, low52Week: 2500, marketCapCr:   15400, peRatio: 35.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'MIDHANI.NS':       { currentPrice: 400,  high52Week: 600,  low52Week: 300,  marketCapCr:    7500, peRatio: 25.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'IDEAFORGE.NS':     { currentPrice: 600,  high52Week: 1100, low52Week: 400,  marketCapCr:    3100, peRatio: 80.0, earningsGrowth: 40, futureGrowth: 9,  socialSentiment: 7 },
  'PREMEXPLN.NS':     { currentPrice: 900,  high52Week: 1400, low52Week: 600,  marketCapCr:     900, peRatio: 20.0, earningsGrowth: 22, futureGrowth: 7,  socialSentiment: 6 },
  'BHEL.NS':          { currentPrice: 250,  high52Week: 340,  low52Week: 160,  marketCapCr:   87000, peRatio: 55.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  'AVANTEL.NS':       { currentPrice: 200,  high52Week: 350,  low52Week: 120,  marketCapCr:     900, peRatio: 30.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 5 },
  // media sector
  'ZEEL.NS':          { currentPrice: 130,  high52Week: 180,  low52Week: 100,  marketCapCr:   12500, peRatio: 15.0, earningsGrowth: 10, futureGrowth: 6,  socialSentiment: 5 },
  'SUNTV.NS':         { currentPrice: 650,  high52Week: 840,  low52Week: 500,  marketCapCr:   25600, peRatio: 15.0, earningsGrowth: 12, futureGrowth: 7,  socialSentiment: 7 },
  'PVRINOX.NS':       { currentPrice: 1500, high52Week: 1900, low52Week: 1100, marketCapCr:   14800, peRatio: 55.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'SAREGAMA.NS':      { currentPrice: 450,  high52Week: 600,  low52Week: 300,  marketCapCr:    8700, peRatio: 30.0, earningsGrowth: 22, futureGrowth: 8,  socialSentiment: 7 },
  'TIPSINDLTD.NS':    { currentPrice: 600,  high52Week: 800,  low52Week: 350,  marketCapCr:    7800, peRatio: 35.0, earningsGrowth: 30, futureGrowth: 8,  socialSentiment: 7 },
  'NETWORK18.NS':     { currentPrice: 70,   high52Week: 110,  low52Week: 50,   marketCapCr:    7400, peRatio: -1,   earningsGrowth: 0,  futureGrowth: 5,  socialSentiment: 5 },
  'TV18BRDCST.NS':    { currentPrice: 40,   high52Week: 60,   low52Week: 30,   marketCapCr:    6800, peRatio: 20.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 5 },
  'NAZARA.NS':        { currentPrice: 900,  high52Week: 1200, low52Week: 600,  marketCapCr:    6800, peRatio: 80.0, earningsGrowth: 35, futureGrowth: 9,  socialSentiment: 8 },
  'DISHTV.NS':        { currentPrice: 15,   high52Week: 25,   low52Week: 10,   marketCapCr:    2700, peRatio: -1,   earningsGrowth: 0,  futureGrowth: 4,  socialSentiment: 4 },
  'HATHWAY.NS':       { currentPrice: 20,   high52Week: 30,   low52Week: 15,   marketCapCr:    3500, peRatio: 25.0, earningsGrowth: 10, futureGrowth: 5,  socialSentiment: 4 },
  'DEN.NS':           { currentPrice: 45,   high52Week: 70,   low52Week: 35,   marketCapCr:    2200, peRatio: 20.0, earningsGrowth: 10, futureGrowth: 5,  socialSentiment: 4 },
  'SHEMAROO.NS':      { currentPrice: 200,  high52Week: 300,  low52Week: 130,  marketCapCr:    1900, peRatio: 18.0, earningsGrowth: 15, futureGrowth: 6,  socialSentiment: 5 },
  'BALAJITELE.NS':    { currentPrice: 60,   high52Week: 100,  low52Week: 40,   marketCapCr:     600, peRatio: -1,   earningsGrowth: 0,  futureGrowth: 4,  socialSentiment: 4 },
  'DBCORP.NS':        { currentPrice: 300,  high52Week: 400,  low52Week: 220,  marketCapCr:    5500, peRatio: 12.0, earningsGrowth: 15, futureGrowth: 6,  socialSentiment: 6 },
  'JAGRAN.NS':        { currentPrice: 100,  high52Week: 140,  low52Week: 75,   marketCapCr:    3100, peRatio: 10.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 5 },
  'HTMEDIA.NS':       { currentPrice: 30,   high52Week: 45,   low52Week: 20,   marketCapCr:     700, peRatio: 8.0,  earningsGrowth: 10, futureGrowth: 5,  socialSentiment: 4 },
  'NAVNETEDUL.NS':    { currentPrice: 130,  high52Week: 175,  low52Week: 95,   marketCapCr:    3100, peRatio: 18.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 5 },
  'NDTV.NS':          { currentPrice: 200,  high52Week: 300,  low52Week: 150,  marketCapCr:    3900, peRatio: 35.0, earningsGrowth: 15, futureGrowth: 6,  socialSentiment: 6 },
  'SANDESH.NS':       { currentPrice: 1200, high52Week: 1600, low52Week: 900,  marketCapCr:    1400, peRatio: 10.0, earningsGrowth: 10, futureGrowth: 5,  socialSentiment: 5 },
  'INFIBEAM.NS':      { currentPrice: 30,   high52Week: 45,   low52Week: 20,   marketCapCr:    8300, peRatio: 35.0, earningsGrowth: 20, futureGrowth: 7,  socialSentiment: 6 },
  // textile sector
  'KPRMILL.NS':       { currentPrice: 850,  high52Week: 1100, low52Week: 650,  marketCapCr:   29200, peRatio: 25.0, earningsGrowth: 20, futureGrowth: 8,  socialSentiment: 7 },
  'LUXIND.NS':        { currentPrice: 2000, high52Week: 2600, low52Week: 1500, marketCapCr:    6000, peRatio: 22.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'GOKALDAS.NS':      { currentPrice: 900,  high52Week: 1200, low52Week: 600,  marketCapCr:    8800, peRatio: 28.0, earningsGrowth: 25, futureGrowth: 8,  socialSentiment: 7 },
  'TRIDENT.NS':       { currentPrice: 35,   high52Week: 55,   low52Week: 25,   marketCapCr:   17700, peRatio: 25.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'RSWM.NS':          { currentPrice: 400,  high52Week: 550,  low52Week: 300,  marketCapCr:    1200, peRatio: 10.0, earningsGrowth: 15, futureGrowth: 6,  socialSentiment: 5 },
  'HIMATSEIDE.NS':    { currentPrice: 150,  high52Week: 220,  low52Week: 100,  marketCapCr:    3200, peRatio: 18.0, earningsGrowth: 12, futureGrowth: 6,  socialSentiment: 5 },
  'ICIL.NS':          { currentPrice: 350,  high52Week: 500,  low52Week: 250,  marketCapCr:    7100, peRatio: 15.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'WELSPUNLIV.NS':    { currentPrice: 150,  high52Week: 200,  low52Week: 100,  marketCapCr:   14700, peRatio: 20.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'DOLLAR.NS':        { currentPrice: 500,  high52Week: 700,  low52Week: 350,  marketCapCr:    3000, peRatio: 18.0, earningsGrowth: 15, futureGrowth: 6,  socialSentiment: 5 },
  'KITEX.NS':         { currentPrice: 600,  high52Week: 800,  low52Week: 400,  marketCapCr:    3600, peRatio: 15.0, earningsGrowth: 18, futureGrowth: 7,  socialSentiment: 6 },
  'VTL.NS':           { currentPrice: 400,  high52Week: 550,  low52Week: 300,  marketCapCr:   11400, peRatio: 12.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 6 },
  'TCNSCLOTH.NS':     { currentPrice: 500,  high52Week: 700,  low52Week: 350,  marketCapCr:    3400, peRatio: 25.0, earningsGrowth: 15, futureGrowth: 7,  socialSentiment: 5 },
  'BSLLTD.NS':        { currentPrice: 120,  high52Week: 180,  low52Week: 80,   marketCapCr:     500, peRatio: 10.0, earningsGrowth: 10, futureGrowth: 5,  socialSentiment: 4 },
  'SIYARAM.NS':       { currentPrice: 500,  high52Week: 700,  low52Week: 350,  marketCapCr:    2400, peRatio: 12.0, earningsGrowth: 15, futureGrowth: 6,  socialSentiment: 5 },
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
  if (name.includes('Auto'))       return 'auto';
  if (name.includes('Metal'))      return 'metals';
  if (name.includes('Telecom'))    return 'telecom';
  if (name.includes('PSU'))        return 'psu';
  if (name.includes('Realty') || name.includes('Real Estate')) return 'realty';
  if (name.includes('Chemical'))   return 'chemicals';
  if (name.includes('Cement'))     return 'cement';
  if (name.includes('Oil') || name.includes('Gas') || name.includes('Energy')) return 'oilgas';
  if (name.includes('Fertil') || name.includes('Agri')) return 'fertilizer';
  if (name.includes('Defence') || name.includes('Defense')) return 'defence';
  if (name.includes('Media') || name.includes('Entertainment')) return 'media';
  if (name.includes('Textile') || name.includes('Apparel')) return 'textile';
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