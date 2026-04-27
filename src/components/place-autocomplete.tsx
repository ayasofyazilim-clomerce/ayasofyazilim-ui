"use client";

import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@repo/ayasofyazilim-ui/components/command";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@repo/ayasofyazilim-ui/components/input-group";
import { Spinner } from "@repo/ayasofyazilim-ui/components/spinner";
import type { BBox, Feature, FeatureCollection, Point } from "geojson";
import { MapPinIcon, SearchIcon } from "lucide-react";
import * as React from "react";

// --- Types ---

export interface PlaceAutocompleteTranslations {
  /** Placeholder for the search input. e.g. "Search address..." */
  "PlaceAutocomplete.placeholder": string;
  /** Message when an error occurs. {0} is error message. */
  "PlaceAutocomplete.searchFailed{0}": string;
  /** Message when no results are found. {0} is the search query. */
  "PlaceAutocomplete.noResults{0}": string;
  /** Fallback string if a place has no name. */
  "PlaceAutocomplete.unknownPlace": string;
}

/** Default English translations */
export const DEFAULT_PLACE_AUTOCOMPLETE_TRANSLATIONS: PlaceAutocompleteTranslations = {
  "PlaceAutocomplete.placeholder": "Search for a place...",
  "PlaceAutocomplete.searchFailed{0}": "Search failed: {0}",
  "PlaceAutocomplete.noResults{0}": "No results found for \"{0}\"",
  "PlaceAutocomplete.unknownPlace": "Unknown location",
};

interface PlaceFeatureProperties {
  osm_id: number;
  osm_type: "N" | "W" | "R";
  osm_key: string;
  osm_value: string;
  type: string;
  name?: string;
  housenumber?: string;
  street?: string;
  locality?: string;
  district?: string;
  postcode?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  extent?: [number, number, number, number];
  extra?: Record<string, string>;
}
export type PlaceFeature = Feature<Point, PlaceFeatureProperties>;
type PlaceFeatureCollection = FeatureCollection<Point, PlaceFeatureProperties>;

interface PlaceSearchOptions {
  query: string;
  lang?: string;
  limit?: number;
  bbox?: BBox;
  lat?: number;
  lon?: number;
  zoom?: number;
  locationBiasScale?: number;
}

interface PlaceAutocompleteProps
  extends Omit<PlaceSearchOptions, "query">,
  Omit<React.ComponentProps<"input">, "value" | "onChange" | "placeholder"> {
  /** Required translations object. Use DEFAULT_PLACE_AUTOCOMPLETE_TRANSLATIONS for English. */
  translations?: PlaceAutocompleteTranslations;
  debounceMs?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onPlaceSelect?: (feature: PlaceFeature) => void;
  onResultsChange?: (results: PlaceFeature[]) => void;
}

// --- Helpers ---

/**
 * Replaces {0}, {1}, etc. in a string with provided arguments.
 */
function t(template: string, ...args: (string | number | undefined)[]) {
  return template.replace(/{(\d+)}/g, (match, index) => {
    const val = args[Number(index)];
    return val !== undefined ? String(val) : match;
  });
}

function formatAddress(properties: PlaceFeatureProperties) {
  const parts = [];
  if (properties.name) parts.push(properties.name);
  if (properties.housenumber && properties.street) {
    parts.push(`${properties.housenumber} ${properties.street}`);
  } else if (properties.street) {
    parts.push(properties.street);
  }
  if (properties.city) parts.push(properties.city);
  else if (properties.locality) parts.push(properties.locality);
  if (properties.state && properties.state !== properties.city) parts.push(properties.state);
  if (properties.country) parts.push(properties.country);
  return [...new Set(parts)].join(", ");
}

function buildSearchUrl(opts: PlaceSearchOptions) {
  const url = new URL("https://photon.komoot.io/api");
  url.searchParams.set("q", opts.query);
  if (opts.lang) url.searchParams.set("lang", opts.lang);
  if (opts.limit) url.searchParams.set("limit", String(opts.limit));
  if (opts.bbox) url.searchParams.set("bbox", opts.bbox.join(","));
  if (opts.lat !== undefined && opts.lon !== undefined) {
    url.searchParams.set("lat", String(opts.lat));
    url.searchParams.set("lon", String(opts.lon));
  }
  if (opts.zoom !== undefined) url.searchParams.set("zoom", String(opts.zoom));
  if (opts.locationBiasScale !== undefined) {
    url.searchParams.set("location_bias_scale", String(opts.locationBiasScale));
  }
  return String(url);
}

// --- Component ---

function PlaceAutocomplete({
  translations = DEFAULT_PLACE_AUTOCOMPLETE_TRANSLATIONS,
  debounceMs = 300,
  lang,
  limit = 5,
  bbox,
  lat,
  lon,
  zoom,
  locationBiasScale,
  className,
  value: controlledValue,
  defaultValue = "",
  onChange: controlledOnChange,
  onPlaceSelect,
  onResultsChange,
  ...props
}: PlaceAutocompleteProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [results, setResults] = React.useState<PlaceFeature[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);

  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // NEW: Ref to prevent search when the change comes from a selection
  const skipNextSearchRef = React.useRef(false);

  const isControlled = controlledValue !== undefined;
  const displayValue = isControlled ? controlledValue : internalValue;

  const performSearch = React.useCallback(
    async (query: string) => {
      // If the skip flag is set, reset it and abort the search
      if (skipNextSearchRef.current) {
        skipNextSearchRef.current = false;
        return;
      }

      if (!query.trim()) {
        setResults([]);
        setIsLoading(false);
        setHasSearched(false);
        onResultsChange?.([]);
        return;
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const url = buildSearchUrl({
          query, lang, limit, bbox, lat, lon, zoom, locationBiasScale,
        });

        const response = await fetch(url, { signal: abortControllerRef.current.signal });
        if (!response.ok) throw new Error(`${response.status}`);

        const data: PlaceFeatureCollection = await response.json();
        const seen = new Set();
        const deduped = data.features.filter((f) => {
          if (seen.has(f.properties.osm_id)) return false;
          seen.add(f.properties.osm_id);
          return true;
        });

        setResults(deduped);
        onResultsChange?.(deduped);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [lang, limit, bbox, lat, lon, zoom, locationBiasScale, onResultsChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (!isControlled) setInternalValue(newValue);
    controlledOnChange?.(newValue);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Only schedule a search if we aren't skipping it
    if (!skipNextSearchRef.current) {
      timeoutRef.current = setTimeout(() => {
        performSearch(newValue);
      }, debounceMs);
    } else {
      // If we were skipping, reset the flag for the next actual user keystroke
      skipNextSearchRef.current = false;
    }
  };

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  const hasNoResults = hasSearched && !isLoading && !error && results.length === 0;
  const showCommandList = error || hasNoResults || results.length > 0;

  return (
    <Command className={cn("h-fit overflow-visible", className)} shouldFilter={false} loop>
      <div className="relative">
        <InputGroup className={cn("border-input! bg-popover! ring-0!", showCommandList && "rounded-b-none")}>
          <InputGroupAddon><SearchIcon /></InputGroupAddon>
          <InputGroupInput
            placeholder={translations["PlaceAutocomplete.placeholder"]}
            value={displayValue}
            onChange={handleInputChange}
            {...props}
          />
          {isLoading && (
            <InputGroupAddon align="inline-end">
              <Spinner />
            </InputGroupAddon>
          )}
        </InputGroup>

        {showCommandList && (
          <CommandList className="bg-popover border-input absolute top-full right-0 left-0 z-50 rounded-b-md border border-t-0 shadow-md">
            {error && (
              <CommandEmpty>
                {t(translations["PlaceAutocomplete.searchFailed{0}"], error.message)}
              </CommandEmpty>
            )}
            {hasNoResults && (
              <CommandEmpty>
                {t(translations["PlaceAutocomplete.noResults{0}"], displayValue)}
              </CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup>
                {results.map((feature) => {
                  const formattedAddress = formatAddress(feature.properties);
                  const name = feature.properties.name || feature.properties.street || translations["PlaceAutocomplete.unknownPlace"];

                  return (
                    <CommandItem
                      key={feature.properties.osm_id}
                      value={String(feature.properties.osm_id)}
                      onSelect={() => {
                        const addr = formatAddress(feature.properties);

                        // 1. Set the skip flag so the next onChange doesn't search
                        skipNextSearchRef.current = true;

                        // 2. Clear any pending debounce timers or active fetches
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                        abortControllerRef.current?.abort();

                        // 3. Update values
                        if (!isControlled) setInternalValue(addr);
                        controlledOnChange?.(addr);
                        onPlaceSelect?.(feature);

                        // 4. Reset state to hide the dropdown
                        setResults([]);
                        setHasSearched(false);
                        setError(null);
                      }}
                    >
                      <MapPinIcon className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start text-start">
                        <span className="font-medium">{name}</span>
                        <span className="text-muted-foreground text-xs">{formattedAddress}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </div>
    </Command>
  );
}

export { PlaceAutocomplete, type PlaceAutocompleteProps };
