import glob
import re

nav_html = """
    <nav class="app-nav">
        <a class="nav-link" href="campuses.html">Select Campus</a><span style="color: #ccc; padding: 6px;">|</span><a class="nav-link" href="dashboard_map.html">Dashboard</a>
        <a class="nav-link" href="canopy.html">Canopy Over Time</a>
        <a class="nav-link" href="trails.html">Trail Analysis</a>
        <a class="nav-link" href="wind.html">Wind Analysis</a>
        <a class="nav-link" href="viewshed.html">Viewshed Greenery</a>
        <a class="nav-link" href="temperature.html">Temp Modeling</a>
        <a class="nav-link" href="soil_moisture.html">Soil Moisture</a>
        <a class="nav-link" href="albedo.html">Albedo</a>
        <a class="nav-link" href="zoning.html">Site Zoning</a>
        <a class="nav-link" id="navData" href="data_pipeline.html">Data Telemetry</a>
        <a class="nav-link" href="3d-vision.html">3D Vision Concept</a>
        <a class="nav-link" href="school.html">School Profile</a>
        <a class="nav-link" href="biodiversity.html">Biodiversity</a>
        <a class="nav-link" href="protocols.html">Protocols</a>
        <a class="nav-link" href="index.html">Community Impact</a>
        <a class="nav-link" href="student_tracking.html">Student Tracking</a>
        <a class="nav-link" href="tree_3d.html">3D Shade Models</a>
        <a class="nav-link" href="survey.html">Wellbeing Survey</a>
    </nav>
"""

clean_nav = nav_html.strip()

for f in glob.glob("*.html"):
    with open(f, "r") as file:
        content = file.read()
    
    # Replace old nav with new clean nav
    # The regex DOTALL matches across newlines
    new_content = re.sub(r'<nav class="app-nav">.*?</nav>', clean_nav, content, flags=re.DOTALL)
    
    basename = f.split('/')[-1]
    
    # Inject active state exactly where needed
    new_content = new_content.replace(f'class="nav-link" href="{basename}"', f'class="nav-link active" href="{basename}"')
    new_content = new_content.replace(f'class="nav-link" id="navData" href="{basename}"', f'class="nav-link active" id="navData" href="{basename}"')
    
    with open(f, "w") as file:
        file.write(new_content)
