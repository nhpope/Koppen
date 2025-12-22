#!/usr/bin/env python3
"""
Preprocess ERA5 Climate Data for Köppen Classification

This script processes ERA5 monthly climate data and converts it to
a TopoJSON format suitable for the Koppen web application.

Data requirements:
- Monthly mean 2m temperature (t2m)
- Monthly total precipitation (tp)
- 12 months of data for each variable

Output:
- TopoJSON file with 0.25-degree grid cells
- Each cell contains monthly temperature and precipitation values
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import numpy as np
    import xarray as xr
    import topojson as tp
    import geopandas as gpd
    from shapely.geometry import box
except ImportError as e:
    print(f"Error: Missing required package: {e}")
    print("Install with: pip install numpy xarray topojson geopandas shapely netcdf4")
    sys.exit(1)


def load_era5_data(temp_path: Path, precip_path: Path) -> tuple:
    """
    Load ERA5 temperature and precipitation data.

    Args:
        temp_path: Path to temperature NetCDF file
        precip_path: Path to precipitation NetCDF file

    Returns:
        Tuple of (temperature dataset, precipitation dataset)
    """
    print(f"Loading temperature data from {temp_path}")
    temp_ds = xr.open_dataset(temp_path)

    print(f"Loading precipitation data from {precip_path}")
    precip_ds = xr.open_dataset(precip_path)

    return temp_ds, precip_ds


def extract_monthly_values(ds: xr.Dataset, var_name: str) -> np.ndarray:
    """
    Extract monthly mean values from dataset.

    Args:
        ds: xarray Dataset
        var_name: Variable name to extract

    Returns:
        Array of shape (12, lat, lon) with monthly values
    """
    # Get the data variable
    data = ds[var_name]

    # Group by month and compute mean
    monthly = data.groupby('time.month').mean(dim='time')

    return monthly.values


def create_grid_cells(lats: np.ndarray, lons: np.ndarray,
                      temp_monthly: np.ndarray,
                      precip_monthly: np.ndarray,
                      resolution: float = 0.25) -> gpd.GeoDataFrame:
    """
    Create grid cells with climate data as GeoDataFrame.

    Args:
        lats: Latitude coordinates
        lons: Longitude coordinates
        temp_monthly: Monthly temperature values (12, lat, lon)
        precip_monthly: Monthly precipitation values (12, lat, lon)
        resolution: Grid resolution in degrees

    Returns:
        GeoDataFrame with grid cells and climate properties
    """
    print("Creating grid cells...")

    cells = []
    half_res = resolution / 2

    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):
            # Get monthly values for this cell
            temps = temp_monthly[:, i, j]
            precips = precip_monthly[:, i, j]

            # Skip cells with missing data
            if np.any(np.isnan(temps)) or np.any(np.isnan(precips)):
                continue

            # Create cell geometry
            cell = box(
                lon - half_res, lat - half_res,
                lon + half_res, lat + half_res
            )

            # Convert temperature from Kelvin to Celsius
            temps_c = temps - 273.15

            # Convert precipitation from m to mm
            precips_mm = precips * 1000

            # Create properties
            props = {
                'geometry': cell,
                'lat': float(lat),
                'lon': float(lon),
                # Monthly temperatures (Celsius)
                't1': round(float(temps_c[0]), 1),
                't2': round(float(temps_c[1]), 1),
                't3': round(float(temps_c[2]), 1),
                't4': round(float(temps_c[3]), 1),
                't5': round(float(temps_c[4]), 1),
                't6': round(float(temps_c[5]), 1),
                't7': round(float(temps_c[6]), 1),
                't8': round(float(temps_c[7]), 1),
                't9': round(float(temps_c[8]), 1),
                't10': round(float(temps_c[9]), 1),
                't11': round(float(temps_c[10]), 1),
                't12': round(float(temps_c[11]), 1),
                # Monthly precipitation (mm)
                'p1': round(float(precips_mm[0]), 1),
                'p2': round(float(precips_mm[1]), 1),
                'p3': round(float(precips_mm[2]), 1),
                'p4': round(float(precips_mm[3]), 1),
                'p5': round(float(precips_mm[4]), 1),
                'p6': round(float(precips_mm[5]), 1),
                'p7': round(float(precips_mm[6]), 1),
                'p8': round(float(precips_mm[7]), 1),
                'p9': round(float(precips_mm[8]), 1),
                'p10': round(float(precips_mm[9]), 1),
                'p11': round(float(precips_mm[10]), 1),
                'p12': round(float(precips_mm[11]), 1),
            }
            cells.append(props)

    print(f"Created {len(cells)} grid cells")
    return gpd.GeoDataFrame(cells, crs="EPSG:4326")


def convert_to_topojson(gdf: gpd.GeoDataFrame, output_path: Path,
                        quantization: int = 1e6) -> None:
    """
    Convert GeoDataFrame to TopoJSON and save.

    Args:
        gdf: GeoDataFrame with climate data
        output_path: Path to save TopoJSON file
        quantization: Quantization level for compression
    """
    print(f"Converting to TopoJSON (quantization: {quantization})...")

    # Convert to TopoJSON
    topo = tp.Topology(gdf, prequantize=quantization)

    # Save to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    topo.to_json(output_path)

    # Get file size
    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"Saved to {output_path} ({size_mb:.2f} MB)")


def generate_sample_data(output_path: Path) -> None:
    """
    Generate sample climate data for testing.

    Creates a simplified dataset with representative climate zones.
    """
    print("Generating sample climate data...")

    # Create a coarse grid for sample data
    lats = np.arange(-60, 70, 5)
    lons = np.arange(-180, 180, 5)

    cells = []

    for lat in lats:
        for lon in lons:
            # Generate realistic-ish temperature based on latitude
            base_temp = 30 - abs(lat) * 0.6

            # Seasonal variation (stronger at higher latitudes)
            seasonal_amp = min(15, abs(lat) * 0.3)

            # Monthly temperatures
            temps = []
            for month in range(12):
                # Northern hemisphere: warmest in July (month 6)
                # Southern hemisphere: warmest in January (month 0)
                if lat >= 0:
                    temp = base_temp + seasonal_amp * np.cos((month - 6) * np.pi / 6)
                else:
                    temp = base_temp + seasonal_amp * np.cos(month * np.pi / 6)
                temps.append(round(temp, 1))

            # Generate precipitation based on latitude and longitude
            # Tropics: high precipitation
            # Subtropics (20-30): low precipitation (deserts)
            # Mid-latitudes: moderate

            if abs(lat) < 15:
                base_precip = 150  # Tropical
            elif abs(lat) < 30:
                base_precip = 30   # Subtropical desert
            elif abs(lat) < 50:
                base_precip = 70   # Temperate
            else:
                base_precip = 40   # Polar

            # Add some variation
            precip_var = base_precip * 0.5
            precips = []
            for month in range(12):
                precip = max(0, base_precip + np.random.uniform(-precip_var, precip_var))
                precips.append(round(precip, 1))

            # Create cell
            cell = box(lon - 2.5, lat - 2.5, lon + 2.5, lat + 2.5)

            props = {
                'geometry': cell,
                'lat': float(lat),
                'lon': float(lon),
            }

            # Add monthly data
            for i, (t, p) in enumerate(zip(temps, precips), 1):
                props[f't{i}'] = t
                props[f'p{i}'] = p

            cells.append(props)

    gdf = gpd.GeoDataFrame(cells, crs="EPSG:4326")
    print(f"Generated {len(gdf)} sample cells")

    convert_to_topojson(gdf, output_path, quantization=1e4)


def main():
    parser = argparse.ArgumentParser(
        description="Preprocess ERA5 climate data for Köppen classification"
    )

    parser.add_argument(
        '--temp', '-t',
        type=Path,
        help='Path to temperature NetCDF file'
    )

    parser.add_argument(
        '--precip', '-p',
        type=Path,
        help='Path to precipitation NetCDF file'
    )

    parser.add_argument(
        '--output', '-o',
        type=Path,
        default=Path('public/data/climate.topojson'),
        help='Output TopoJSON path'
    )

    parser.add_argument(
        '--resolution', '-r',
        type=float,
        default=0.25,
        help='Grid resolution in degrees'
    )

    parser.add_argument(
        '--sample',
        action='store_true',
        help='Generate sample data instead of processing real data'
    )

    parser.add_argument(
        '--quantization', '-q',
        type=int,
        default=1000000,
        help='TopoJSON quantization level'
    )

    args = parser.parse_args()

    if args.sample:
        generate_sample_data(args.output)
        return

    if not args.temp or not args.precip:
        print("Error: --temp and --precip required unless using --sample")
        sys.exit(1)

    if not args.temp.exists():
        print(f"Error: Temperature file not found: {args.temp}")
        sys.exit(1)

    if not args.precip.exists():
        print(f"Error: Precipitation file not found: {args.precip}")
        sys.exit(1)

    # Load data
    temp_ds, precip_ds = load_era5_data(args.temp, args.precip)

    # Extract monthly values
    # Note: Variable names may differ based on ERA5 product
    temp_var = 't2m' if 't2m' in temp_ds else list(temp_ds.data_vars)[0]
    precip_var = 'tp' if 'tp' in precip_ds else list(precip_ds.data_vars)[0]

    temp_monthly = extract_monthly_values(temp_ds, temp_var)
    precip_monthly = extract_monthly_values(precip_ds, precip_var)

    # Get coordinates
    lat_name = 'latitude' if 'latitude' in temp_ds.coords else 'lat'
    lon_name = 'longitude' if 'longitude' in temp_ds.coords else 'lon'

    lats = temp_ds.coords[lat_name].values
    lons = temp_ds.coords[lon_name].values

    # Create grid cells
    gdf = create_grid_cells(lats, lons, temp_monthly, precip_monthly, args.resolution)

    # Convert to TopoJSON
    convert_to_topojson(gdf, args.output, args.quantization)

    print("Done!")


if __name__ == '__main__':
    main()
