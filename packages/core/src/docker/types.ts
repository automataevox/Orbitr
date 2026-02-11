import type Dockerode from "dockerode";

export interface ContainerCreateOptions {
  name: string;
  image: string;
  env?: string[];
  ports?: Record<string, unknown>;
  volumes?: string[];
  networks?: string[];
  labels?: Record<string, string>;
  restart?: string;
  command?: string[];
}

export interface ContainerStats {
  id: string;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryLimit: number;
  networkRx: number;
  networkTx: number;
}

export interface DockerInfo {
  serverVersion: string;
  apiVersion: string;
  containers: number;
  containersRunning: number;
  containersPaused: number;
  containersStopped: number;
  images: number;
  memoryTotal: number;
  cpus: number;
}

export type ContainerInspectInfo = Dockerode.ContainerInspectInfo;
export type ImageInfo = Dockerode.ImageInfo;
export type NetworkInspectInfo = Dockerode.NetworkInspectInfo;
export type VolumeInspectInfo = Dockerode.VolumeInspectInfo;
