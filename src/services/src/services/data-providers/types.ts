export type ProviderGame =
  | import("./espn").ESPNGame
  | import("./sportradar").SportradarGame
  | import("./odds-api").OddsApiGame
  | import("./mock").MockGame;
