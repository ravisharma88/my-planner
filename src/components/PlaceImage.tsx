import { useEffect, useState } from 'react'

type CommonsPage = {
  index?: number
  imageinfo?: {
    thumburl?: string
    descriptionurl?: string
    extmetadata?: {
      Artist?: { value?: string }
      LicenseShortName?: { value?: string }
    }
  }[]
}

type PlacePhoto = {
  url: string
  descriptionUrl: string
  credit: string
}

const photoCache = new Map<string, Promise<PlacePhoto | null>>()

function findPlacePhoto(destination: string): Promise<PlacePhoto | null> {
  const cachedPhoto = photoCache.get(destination)
  if (cachedPhoto) return cachedPhoto

  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrsearch', `${destination} landmark`)
  url.searchParams.set('gsrnamespace', '6')
  url.searchParams.set('gsrlimit', '10')
  url.searchParams.set('prop', 'imageinfo')
  url.searchParams.set('iiprop', 'url|extmetadata')
  url.searchParams.set('iiurlwidth', '1400')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const photoRequest = fetch(url)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Place photo search failed with status ${response.status}`)
      const result = await response.json() as { query?: { pages?: Record<string, CommonsPage> } }
      const pages = Object.values(result.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      const page = pages.find((candidate) => candidate.imageinfo?.[0]?.thumburl)
      const image = page?.imageinfo?.[0]
      if (!image?.thumburl || !image.descriptionurl) return null

      const artist = image.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, '').trim()
      const license = image.extmetadata?.LicenseShortName?.value
      return {
        url: image.thumburl,
        descriptionUrl: image.descriptionurl,
        credit: [artist, license].filter(Boolean).join(' · ') || 'Wikimedia Commons',
      }
    })
    .catch((error: unknown) => {
      photoCache.delete(destination)
      console.error(`Unable to load a photo for ${destination}.`, error)
      return null
    })

  photoCache.set(destination, photoRequest)
  return photoRequest
}

export function PlaceImage({ destination, className }: { destination: string; className?: string }) {
  return <ResolvedPlaceImage key={destination} destination={destination} className={className} />
}

function ResolvedPlaceImage({ destination, className }: { destination: string; className?: string }) {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null)

  useEffect(() => {
    let active = true
    findPlacePhoto(destination).then((result) => {
      if (active) setPhoto(result)
    })

    return () => {
      active = false
    }
  }, [destination])

  return (
    <>
      {photo && <img className={className} src={photo.url} alt={`${destination}`} loading="lazy" />}
      {photo && (
        <span className="place-photo-credit" title={`Photo by ${photo.credit}`}>
          Photo by {photo.credit}
        </span>
      )}
    </>
  )
}
