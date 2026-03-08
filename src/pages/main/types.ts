export interface Torrent {
  hash?: string;
  name?: string;
  size?: number;
  progress?: number;
  dlspeed?: number;
  upspeed?: number;
  state?: string;
  eta?: number;
  num_seeds?: number;
  num_leechs?: number;
  category?: string;
  downloaded?: number;
  uploaded?: number;
  ratio?: number;
  added_on?: number;
}

export interface TransferInfo {
  dl_info_speed: number;
  up_info_speed: number;
  dl_info_data: number;
  up_info_data: number;
  dht_nodes: number;
}

export type FilterKey =
  | "all"
  | "downloading"
  | "completed"
  | "paused"
  | "active"
  | "inactive"
  | "stalled"
  | "errored";
