# Scientific Literature & Ecosystem Services Tracking

This document serves as our centralized knowledge base for the scientific research underpinning the UTRGV Agroecology Dashboard. As we review scientific papers, we will extract key ecosystem services, metrics, and philosophical insights to directly inform dashboard features.

## Our Research Workflow

1. **Intake:** You provide the title, link, or text of a scientific paper.
2. **Extraction:** We will parse the paper to identify explicit ecosystem services (e.g., carbon sequestration rates, evapotranspiration cooling metrics, psychological benefits of green views).
3. **Mapping:** We will brainstorm how to represent these findings in the dashboard (e.g., adding a new data layer, tweaking a calculation, or adding educational context).
4. **Implementation:** We track the progress of integrating these scientific truths into the software.

## Literature Database

| Paper Title / Topic | Key Findings | Ecosystem Service | Dashboard Application | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Alexander (1965). A city is not a tree.** | Cities (and campuses) are complex semi-lattices of overlapping organic interactions, not rigid hierarchical trees. | Urban Design / Connectivity | Guide the trail analysis and walking combinatorial metrics; avoid rigid A-to-B routing. | Logged |
| **Bolund & Hunhammar (1999). Ecosystem services in urban areas.** | Categorizes specific urban ecosystem services (air filtering, microclimate regulation, noise reduction, recreation). | General Ecosystem Services | Form the structural categories for the Community Impact dashboard. | Logged |
| **Campbell et al. (2022). Centering community in urban forestry.** | Urban forests fail without deep, sustained community engagement and social stewardship. | Social-Ecological Systems | Drive the "Community Uploads" temporal photography and curriculum alignment tools. | Logged |
| **Dobbs et al. (2011). Framework for urban forest indicators.** | Develops quantitative indicators for assessing structural and functional ecosystem goods. | Quantification Framework | Inform the specific formulas used to calculate canopy shade vs temp drop in `canopy.js`. | Logged |
| **Dwyer et al. (1992). Assessing benefits and costs of urban forests.** | Early benchmark quantifying the economic and social value of urban trees. | Economic Valuation | Potential baseline for an ROI calculator (energy savings from cooling). | Logged |
| **Escobedo et al. (2011). Urban forests and pollution mitigation.** | Analyzes the net effect of trees on air quality (services vs. disservices like VOC emissions). | Air Quality / Pollution | Could inform a future PM2.5/Air Quality module. | Logged |
| **Groninger et al. (2002). Small rural communities & urban forestry.** | Addresses the unique challenges of implementing urban forestry in smaller, less-resourced municipalities. | Implementation / Scale | Ensure the dashboard remains accessible and deployable for small RGV school districts. | Logged |
| **Livesley et al. (2016). Impacts on water, heat, and pollution cycles.** | Scale-dependent effects of trees on street canyons vs city-wide heat islands. | Heat & Water Cycles | Underpins the scientific modeling for the Soil Moisture and Albedo maps. | Logged |
| **Lin et al. (2019). Review of urban forest modeling.** | Reviews existing modeling tools (like i-Tree) and identifies gaps in temporal tracking. | Modeling Systems | Validates our approach to building a custom temporal/time-series growth tracker. | Logged |
| **National Research Council (2013). Ecosystem Services Research Agenda.** | Synthesis of research gaps and priorities in urban forestry. | Broad Framework | Guide phase 3 roadmapping. | Logged |
| **Qi & Zhang (2003). Urban forestry in the USA.** | Historical context and trends in US urban forestry. | Historical Context | Inform the narrative or educational tooltips on the School Profile page. | Logged |
| **Schoeneman (1994). Managing the forests where we live.** | Practical management strategies for urban canopies. | Management / Maintenance | Inform future modules tracking tree mortality or maintenance schedules. | Logged |
| **Vogt et al. (2024). Urban forest social–ecological systems.** | A modern, comprehensive framework treating urban forests as intrinsically linked social AND ecological networks. | Social-Ecological Systems | Validate our heavy focus on the "Community Impact" metrics (student well-being). | Logged |
| **Wolf (2010). Human health & well-being.** | Gathers rigorous evidence linking urban greening to physical health and psychological recuperation. | Psychological / Health | Direct scientific backing for tracking "Outdoor Learning Hours" and "Mental Health." | Logged |
| **World Forestry Center (1993). Technical Guide.** | Foundational technical guidelines for urban planting. | Practical Implementation | Guide the specific 3D tree species models (Live Oak, Retama) used in our visualizations. | Logged |

## Philosophical & Educational Concepts
*A space to capture broader paradigms from the literature and user feedback that shape the 'voice' and educational approach of the dashboard.*

- **The "Coffee Table Book" Aesthetic (User Audio Directive):** The dashboard must reject the frantic, gamified, dopamine-driven UI common in modern software. Instead, it should pace the user. It should feel like opening a high-end, beautifully curated architectural or ecological coffee table book. 
- **Anti-Gamification:** Information should be presented gracefully, relying on high-quality visuals (AI photography, 3D models), clean typography, and slow reading. Do not flood the user with flashing alerts, unprompted popups, or cluttered data visualizations.
- **Deep Curation:** The interface is not merely a database query tool; it is a curated narrative explaining *how* and *why* the microforest changes the school's social and thermal reality. Every module must connect back to this narrative.
