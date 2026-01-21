let farmerId: string | null = null;

export function setFarmerId(id: string) {
  farmerId = id;
}

export function getFarmerId() {
  return farmerId;
}

export function clearSession() {
  farmerId = null;
}
