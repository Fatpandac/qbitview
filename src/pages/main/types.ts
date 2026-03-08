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

export interface TorrentProperty {
  save_path?: string;
  creation_date?: number;
  piece_size?: number;
  comment?: string;
  total_wasted?: number;
  total_uploaded?: number;
  total_uploaded_session?: number;
  total_downloaded?: number;
  total_downloaded_session?: number;
  up_limit?: number;
  dl_limit?: number;
  time_elapsed?: number;
  seeding_time?: number;
  nb_connections?: number;
  nb_connections_limit?: number;
  share_ratio?: number;
  addition_date?: number;
  completion_date?: number;
  created_by?: string;
  dl_speed_avg?: number;
  dl_speed?: number;
  eta?: number;
  last_seen?: number;
  peers?: number;
  peers_total?: number;
  pieces_have?: number;
  pieces_num?: number;
  reannounce?: number;
  seeds?: number;
  seeds_total?: number;
  total_size?: number;
  up_speed_avg?: number;
  up_speed?: number;
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
