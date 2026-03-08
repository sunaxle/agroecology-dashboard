window.APP_CONFIG = {
  map: {
    basemap: "hybrid", // Using hybrid to see street labels over satellite
    center: [-98.0706, 26.1675], // Exact location of J.W. Caceres & M. Rivas Academy 
    zoom: 17,
    minZoom: 16,
    maxZoom: 19
  },
  districts: [
    {
      id: "mercedes",
      name: "Mercedes CSID",
      where: "LEA_NAME LIKE 'Mercedes%'"
    },
    {
      id: "donna",
      name: "Donna ISD",
      where: "LEA_NAME = 'Donna ISD'"
    }
  ],
  layers: {
    districts: {
      type: "feature",
      title: "School Districts",
      url: "https://nces.ed.gov/opengis/rest/services/School_District_Boundaries/EDGE_ADMINDATA_SCHOOLDISTRICTS_SY2223/MapServer/1"
    },
    schools: {
      type: "feature",
      title: "Elementary Campuses",
      url: "https://services1.arcgis.com/Ua5sjt3LWTPigjyD/ArcGIS/rest/services/School_Characteristics_Current/FeatureServer/0"
    },
    canopy: {
      type: "imagery",
      title: "Tree Canopy",
      url: ""
    },
    albedo: {
      type: "imagery",
      title: "Albedo",
      url: ""
    },
    lstSummer: {
      type: "imagery",
      title: "Summer Land Surface Temperature",
      url: ""
    },
    lstSpring: {
      type: "imagery",
      title: "Spring Land Surface Temperature",
      url: ""
    },
    lstFall: {
      type: "imagery",
      title: "Fall Land Surface Temperature",
      url: ""
    },
    lstWinter: {
      type: "imagery",
      title: "Winter Land Surface Temperature",
      url: ""
    },
    schoolAreas: {
      type: "feature",
      title: "School Areas",
      url: ""
    },
    treeObservations: {
      type: "feature",
      title: "Tree Observations",
      url: ""
    },
    rgv: {
      reference: {
        title: "Reference",
        layers: [
          {
            title: "City Limits Reference",
            url: "https://services5.arcgis.com/ELI1iJkCzTIagHkp/arcgis/rest/services/RGV_Communities/FeatureServer/0"
          },
          {
            title: "City Limits",
            url: "https://services5.arcgis.com/ELI1iJkCzTIagHkp/arcgis/rest/services/RGV_Communities/FeatureServer/0"
          },
          {
            title: "Schools/Medical Reference",
            url: "https://services5.arcgis.com/ELI1iJkCzTIagHkp/arcgis/rest/services/RGV_Schools_Medical/FeatureServer/0"
          },
          {
            title: "Rights-of-Way (ROW) Reference",
            url: "https://services5.arcgis.com/ELI1iJkCzTIagHkp/arcgis/rest/services/RGV_RightOfWay/FeatureServer/0"
          }
        ]
      },
      residential: {
        title: "Residential Areas",
        layers: [
          {
            title: "Residential Areas Over 500 Meters of a Park or Greenspace",
            url: "https://services5.arcgis.com/ELI1iJkCzTIagHkp/arcgis/rest/services/RGV_ResidentialAreas_Over500m_FromParks/FeatureServer/0"
          },
          {
            title: "Residential Areas Within 500 Meters of a Park or Greenspace",
            url: "https://services5.arcgis.com/ELI1iJkCzTIagHkp/arcgis/rest/services/RGV_ResidentialAreas_Within500m_FromParks/FeatureServer/0"
          },
          {
            title: "Parks and Greenspaces",
            url: "https://services5.arcgis.com/ELI1iJkCzTIagHkp/arcgis/rest/services/Protected_Areas_RGV/FeatureServer/0"
          }
        ]
      },
      standalone: [
        {
          title: "Rights-of-Way (ROW)",
          url: "https://services5.arcgis.com/ELI1iJkCzTIagHkp/arcgis/rest/services/RGV_RightOfWay/FeatureServer/0",
          visible: true
        },
        {
          title: "Schools/Medical",
          url: "https://services5.arcgis.com/ELI1iJkCzTIagHkp/arcgis/rest/services/RGV_Schools_Medical/FeatureServer/0",
          visible: false
        }
      ]
    }
  },
  fields: {
    districtName: "LEA_NAME",
    schoolsDistrict: "LEA_NAME",
    schoolsLevel: "SCHOOL_LEVEL",
    schoolsType: "SCHOOL_TYPE_TEXT",
    schoolsName: "SCH_NAME",
    observationSchool: "school_id",
    observationCount: "trees_count",
    observationObserver: "observer",
    observationDate: "obs_date",
    observationMethod: "method",
    observationNotes: "notes",
    areaSchool: "school_id",
    areaName: "school_name"
  },
  metrics: {
    mercedes: {
      canopyPct: 5,
      albedoPct: 45,
      lst: {
        summer: 109,
        spring: 102,
        fall: 92,
        winter: 80
      }
    },
    donna: {
      canopyPct: 7,
      albedoPct: 40,
      lst: {
        summer: 108,
        spring: 101,
        fall: 91,
        winter: 79
      }
    }
  },
  treeSpecies: {
    "Bur Oak": {
      growthRateFeetPerYear: 2.5,
      color: [34, 139, 34, 0.6] // ForestGreen
    },
    "Live Oak": {
      growthRateFeetPerYear: 2.0,
      color: [0, 100, 0, 0.6] // DarkGreen
    },
    "Montezuma Bald Cypress": {
      growthRateFeetPerYear: 3.0,
      color: [143, 188, 143, 0.6] // DarkSeaGreen
    },
    "Texas Pecan": {
      growthRateFeetPerYear: 2.5,
      color: [107, 142, 35, 0.6] // OliveDrab
    },
    "Mexican Sycamore": {
      growthRateFeetPerYear: 3.0,
      color: [154, 205, 50, 0.6] // YellowGreen
    }
  },
  swipe: {
    leading: "canopy",
    trailing: "lstSummer"
  }
};
