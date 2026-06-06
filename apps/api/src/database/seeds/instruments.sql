-- ============================================================================
-- Global instrument catalog (idempotent)
-- ============================================================================
-- Loaded by migration and db:seed. Safe to run repeatedly.
-- ============================================================================

INSERT INTO instrument (symbol, name, "assetClass", exchange, currency, "providerSymbol", "isActive")
VALUES
  -- US equity index futures (CME)
  ('ES',  'E-mini S&P 500',           'futures', 'CME', 'USD', NULL, true),
  ('NQ',  'E-mini Nasdaq-100',        'futures', 'CME', 'USD', NULL, true),
  ('YM',  'E-mini Dow Jones',         'futures', 'CBOT', 'USD', NULL, true),
  ('RTY', 'E-mini Russell 2000',      'futures', 'CME', 'USD', NULL, true),
  ('MES', 'Micro E-mini S&P 500',     'futures', 'CME', 'USD', NULL, true),
  ('MNQ', 'Micro E-mini Nasdaq-100',  'futures', 'CME', 'USD', NULL, true),
  ('MYM', 'Micro E-mini Dow',         'futures', 'CBOT', 'USD', NULL, true),
  ('M2K', 'Micro E-mini Russell 2000','futures', 'CME', 'USD', NULL, true),

  -- Energy & metals futures
  ('CL',  'Crude Oil WTI',            'futures', 'NYMEX', 'USD', NULL, true),
  ('MCL', 'Micro Crude Oil WTI',      'futures', 'NYMEX', 'USD', NULL, true),
  ('NG',  'Natural Gas',              'futures', 'NYMEX', 'USD', NULL, true),
  ('GC',  'Gold',                     'futures', 'COMEX', 'USD', NULL, true),
  ('MGC', 'Micro Gold',               'futures', 'COMEX', 'USD', NULL, true),
  ('SI',  'Silver',                   'futures', 'COMEX', 'USD', NULL, true),
  ('HG',  'Copper',                   'futures', 'COMEX', 'USD', NULL, true),
  ('PL',  'Platinum',                 'futures', 'NYMEX', 'USD', NULL, true),

  -- Treasury futures
  ('ZB',  '30-Year T-Bond',           'futures', 'CBOT', 'USD', NULL, true),
  ('ZN',  '10-Year T-Note',           'futures', 'CBOT', 'USD', NULL, true),
  ('ZF',  '5-Year T-Note',            'futures', 'CBOT', 'USD', NULL, true),
  ('ZT',  '2-Year T-Note',            'futures', 'CBOT', 'USD', NULL, true),

  -- Currency futures (CME)
  ('6E',  'Euro FX Futures',          'futures', 'CME', 'USD', NULL, true),
  ('6B',  'British Pound Futures',    'futures', 'CME', 'USD', NULL, true),
  ('6J',  'Japanese Yen Futures',     'futures', 'CME', 'USD', NULL, true),
  ('6A',  'Australian Dollar Futures', 'futures', 'CME', 'USD', NULL, true),
  ('6C',  'Canadian Dollar Futures',  'futures', 'CME', 'USD', NULL, true),
  ('6S',  'Swiss Franc Futures',      'futures', 'CME', 'USD', NULL, true),

  -- Agricultural futures
  ('ZC',  'Corn',                     'futures', 'CBOT', 'USD', NULL, true),
  ('ZS',  'Soybeans',                 'futures', 'CBOT', 'USD', NULL, true),
  ('ZW',  'Wheat',                    'futures', 'CBOT', 'USD', NULL, true),

  -- European index futures (prop-firm common)
  ('FDAX', 'DAX Futures',             'futures', 'EUREX', 'EUR', NULL, true),
  ('FESX', 'Euro Stoxx 50 Futures',   'futures', 'EUREX', 'EUR', NULL, true),

  -- Forex spot majors & crosses
  ('EURUSD', 'Euro / US Dollar',       'forex', NULL, 'USD', NULL, true),
  ('GBPUSD', 'British Pound / US Dollar', 'forex', NULL, 'USD', NULL, true),
  ('USDJPY', 'US Dollar / Japanese Yen', 'forex', NULL, 'JPY', NULL, true),
  ('USDCHF', 'US Dollar / Swiss Franc', 'forex', NULL, 'CHF', NULL, true),
  ('AUDUSD', 'Australian Dollar / US Dollar', 'forex', NULL, 'USD', NULL, true),
  ('USDCAD', 'US Dollar / Canadian Dollar', 'forex', NULL, 'CAD', NULL, true),
  ('NZDUSD', 'New Zealand Dollar / US Dollar', 'forex', NULL, 'USD', NULL, true),
  ('EURGBP', 'Euro / British Pound',   'forex', NULL, 'GBP', NULL, true),
  ('EURJPY', 'Euro / Japanese Yen',    'forex', NULL, 'JPY', NULL, true),
  ('GBPJPY', 'British Pound / Japanese Yen', 'forex', NULL, 'JPY', NULL, true),
  ('AUDJPY', 'Australian Dollar / Japanese Yen', 'forex', NULL, 'JPY', NULL, true),
  ('EURAUD', 'Euro / Australian Dollar', 'forex', NULL, 'AUD', NULL, true),
  ('EURCHF', 'Euro / Swiss Franc',     'forex', NULL, 'CHF', NULL, true),
  ('CADJPY', 'Canadian Dollar / Japanese Yen', 'forex', NULL, 'JPY', NULL, true),
  ('CHFJPY', 'Swiss Franc / Japanese Yen', 'forex', NULL, 'JPY', NULL, true),

  -- Popular US stocks
  ('AAPL', 'Apple Inc.',               'stocks', 'NASDAQ', 'USD', NULL, true),
  ('MSFT', 'Microsoft Corporation',  'stocks', 'NASDAQ', 'USD', NULL, true),
  ('GOOGL', 'Alphabet Inc. Class A',   'stocks', 'NASDAQ', 'USD', NULL, true),
  ('GOOG', 'Alphabet Inc. Class C',    'stocks', 'NASDAQ', 'USD', NULL, true),
  ('AMZN', 'Amazon.com Inc.',          'stocks', 'NASDAQ', 'USD', NULL, true),
  ('NVDA', 'NVIDIA Corporation',       'stocks', 'NASDAQ', 'USD', NULL, true),
  ('TSLA', 'Tesla Inc.',               'stocks', 'NASDAQ', 'USD', NULL, true),
  ('META', 'Meta Platforms Inc.',      'stocks', 'NASDAQ', 'USD', NULL, true),
  ('AMD',  'Advanced Micro Devices',   'stocks', 'NASDAQ', 'USD', NULL, true),
  ('NFLX', 'Netflix Inc.',             'stocks', 'NASDAQ', 'USD', NULL, true),
  ('AVGO', 'Broadcom Inc.',            'stocks', 'NASDAQ', 'USD', NULL, true),
  ('CRM',  'Salesforce Inc.',          'stocks', 'NYSE', 'USD', NULL, true),
  ('JPM',  'JPMorgan Chase & Co.',     'stocks', 'NYSE', 'USD', NULL, true),
  ('BAC',  'Bank of America Corp.',    'stocks', 'NYSE', 'USD', NULL, true),
  ('XOM',  'Exxon Mobil Corporation',  'stocks', 'NYSE', 'USD', NULL, true),
  ('COIN', 'Coinbase Global Inc.',     'stocks', 'NASDAQ', 'USD', NULL, true),
  ('PLTR', 'Palantir Technologies',    'stocks', 'NYSE', 'USD', NULL, true),
  ('SOFI', 'SoFi Technologies',        'stocks', 'NASDAQ', 'USD', NULL, true),

  -- ETFs & indices (as stocks)
  ('SPY',  'SPDR S&P 500 ETF',        'stocks', 'NYSE', 'USD', NULL, true),
  ('QQQ',  'Invesco QQQ Trust',       'stocks', 'NASDAQ', 'USD', NULL, true),
  ('IWM',  'iShares Russell 2000 ETF','stocks', 'NYSE', 'USD', NULL, true),
  ('DIA',  'SPDR Dow Jones ETF',      'stocks', 'NYSE', 'USD', NULL, true),
  ('VTI',  'Vanguard Total Stock Market ETF', 'stocks', 'NYSE', 'USD', NULL, true),
  ('ARKK', 'ARK Innovation ETF',      'stocks', 'NYSE', 'USD', NULL, true),

  -- Crypto (USD pairs; providerSymbol maps to mock feed tickers where needed)
  ('BTCUSD', 'Bitcoin / US Dollar',   'crypto', NULL, 'USD', 'BTC', true),
  ('ETHUSD', 'Ethereum / US Dollar',  'crypto', NULL, 'USD', 'ETH', true),
  ('SOLUSD', 'Solana / US Dollar',    'crypto', NULL, 'USD', 'SOL', true),
  ('XRPUSD', 'Ripple / US Dollar',    'crypto', NULL, 'USD', 'XRP', true),
  ('BNBUSD', 'BNB / US Dollar',       'crypto', NULL, 'USD', 'BNB', true),
  ('ADAUSD', 'Cardano / US Dollar',   'crypto', NULL, 'USD', 'ADA', true),
  ('DOGEUSD', 'Dogecoin / US Dollar', 'crypto', NULL, 'USD', 'DOGE', true),
  ('AVAXUSD', 'Avalanche / US Dollar', 'crypto', NULL, 'USD', 'AVAX', true),
  ('LINKUSD', 'Chainlink / US Dollar', 'crypto', NULL, 'USD', 'LINK', true),
  ('LTCUSD', 'Litecoin / US Dollar',   'crypto', NULL, 'USD', 'LTC', true),

  -- Options underlyings (common)
  ('SPX',  'S&P 500 Index',           'options', 'CBOE', 'USD', NULL, true),
  ('NDX',  'Nasdaq-100 Index',        'options', 'NASDAQ', 'USD', NULL, true),
  ('VIX',  'CBOE Volatility Index',   'options', 'CBOE', 'USD', NULL, true),
  ('RUT',  'Russell 2000 Index',      'options', 'CBOE', 'USD', NULL, true)
ON CONFLICT (symbol) DO NOTHING;
