export type DestinationCoordinates = {
  latitude: number
  longitude: number
}

type PhotonResponse = {
  features: Array<{
    geometry: {
      coordinates: [number, number]
    }
  }>
}

const coordinateRequests = new Map<string, Promise<DestinationCoordinates | null>>()

export function getDestinationCoordinates(destination: string) {
  const key = destination.trim().toLocaleLowerCase()
  const cachedRequest = coordinateRequests.get(key)
  if (cachedRequest) return cachedRequest

  const request = fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(destination)}&limit=1`)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Place lookup failed (${response.status}).`)
      const data = await response.json() as PhotonResponse
      const coordinates = data.features[0]?.geometry.coordinates
      if (!coordinates || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) return null
      return { longitude: coordinates[0], latitude: coordinates[1] }
    })
    .catch((error: unknown) => {
      coordinateRequests.delete(key)
      throw error
    })

  coordinateRequests.set(key, request)
  return request
}
