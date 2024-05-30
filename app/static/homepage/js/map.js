    var map = L.map('map').setView([15.9753, 120.5670], 12);

    var osm = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '<a>OpenStreetMap</a>'
    }).addTo(map);

    var sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '<a>OpenStreetMap</a>'
    });

    var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 16,
	attribution: '<a>OpenStreetMap</a>'
    });

    var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '<a>OpenStreetMap</a>'
    });

    // Existing marker
    var singleMarker = L.marker([15.9980, 120.5753]);

    singleMarker.on('mouseover', function(e) {
        var popupContent = '<b>Barangay</b>: Anonas <br>' +
            '<b>Region</b>: Ilocos Region (Region 1) <br>' +
            '<b>Province</b>: Pangasinan <br>' +
            '<b>City</b>: Urdaneta <br>' +
            '<b>Postal Code</b>: 2428 <br>' +
            '<b>Population</b>: 6,221 <br>' +
            '<b>Coordinates</b>: 15.9980,120.5753 <br>' +
            '<b>Est. elevation abv sea lvl</b>: 30.0 meters (98.4 feet)';

        this.bindPopup(popupContent).openPopup();
    });

    singleMarker.on('mouseout', function(e) {
        this.closePopup();
    });

    singleMarker.addTo(map);

    // New markers
    var markersData = [
        {
            name: 'Bactad East',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '2,175',
            coordinates: [15.9790, 120.6219],
            elevation: '36.4 meters (119.4 feet)'
        },
        {
            name: 'Bayaoas',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '5,789',
            coordinates: [15.9761, 120.5772],
            elevation: '30.7 meters (100.7 feet)'
        },
        {
            name: 'Bolaoen',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '1,506',
            coordinates: [15.9926, 120.6060],
            elevation: '32.1 meters (105.3 feet)'
        },
        {
            name: 'Cabaruan',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '2,353',
            coordinates: [15.9453, 120.5236],
            elevation: '31.4 meters (103.0 feet)'
        },
        {
            name: 'Cabuloan',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '3,506',
            coordinates: [15.9764, 120.6014],
            elevation: '35.7 meters (117.1 feet)'
        },
        {
            name: 'Camanang',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '5,109',
            coordinates: [15.9612, 120.5938],
            elevation: '33.2 meters (108.9 feet)'
        },
        {
            name: 'Camantiles',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '6,605',
            coordinates: [15.9895, 120.5455],
            elevation: '28.5 meters (93.5 feet)'
        },
        {
            name: 'Casantaan',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '1,549',
            coordinates: [15.9838, 120.6043],
            elevation: '35.8 meters (117.5 feet)'
        },
        {
            name: 'Catablan',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '6,082',
            coordinates: [15.9686, 120.4979],
            elevation: '22.8 meters (74.8 feet)'
        },
        {
            name: 'Cayambanan',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '4,440',
            coordinates: [15.9990, 120.5921],
            elevation: '32.6 meters (107.0 feet)'
        },
        {
            name: 'Consolacion',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '1,750',
            coordinates: [15.9532, 120.5985],
            elevation: '34.1 meters (111.9 feet)'
        },
        {
            name: 'Dilan Paurido',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '7,391',
            coordinates: [15.9745, 120.5820],
            elevation: '32.7 meters (107.3 feet)'
        },
        {
            name: 'Dr. Pedro T. Orata (Bactad Proper)',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '2,393',
            coordinates: [15.9769, 120.6082],
            elevation: '37.0 meters (121.4 feet)'
        },
        {
            name: 'Labit Proper',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '3,855',
            coordinates: [15.9567, 120.5301],
            elevation: '24.7 meters (81.0 feet)'
        },
        {
            name: 'Cabuloan',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '3,506',
            coordinates: [15.9764, 120.6014],
            elevation: '35.7 meters (117.1 feet)'
        },
        {
            name: 'Cayambanan',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '4,440',
            coordinates: [15.9990, 120.5921],
            elevation: '32.6 meters (107.0 feet)'
        },
        {
            name: 'Consolacion',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '1,750',
            coordinates: [15.9532, 120.5985],
            elevation: '34.1 meters (111.9 feet)'
        },
        {
            name: 'Dilan Paurido',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '7,391',
            coordinates: [15.9745, 120.5820],
            elevation: '32.7 meters (107.3 feet)'
        },
        {
            name: 'Dr. Pedro T. Orata (Bactad Proper)',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '2,393',
            coordinates: [15.9769, 120.6082],
            elevation: '37.0 meters (121.4 feet)'
        },
        {
            name: 'Labit Proper',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '3,855',
            coordinates: [15.9567, 120.5301],
            elevation: '24.7 meters (81.0 feet)'
        },
        {
            name: 'Labit West',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '2,708',
            coordinates: [15.9571, 120.5151],
            elevation: '23.6 meters (77.4 feet)'
        },
        {
            name: 'Mabanogbog',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '3,470',
            coordinates: [15.9768, 120.5546],
            elevation: '27.4 meters (89.9 feet)'
        },
        {
            name: 'Macalong',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '1,553',
            coordinates: [15.9603, 120.6080],
            elevation: '34.9 meters (114.5 feet)'
        },
        {
            name: 'Nancalobasaan',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '3,315',
            coordinates: [16.0085, 120.6023],
            elevation: '32.5 meters (106.6 feet)'
        },
        {
            name: 'Nancamaliran East',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '5,542',
            coordinates: [15.9747, 120.5469],
            elevation: '27.9 meters (91.5 feet)'
        },
        {
            name: 'Nancamaliran West',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '5,748',
            coordinates: [15.9770, 120.5418],
            elevation: '28.5 meters (93.5 feet)'
        },
        {
            name: 'Nancayasan',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '8,742',
            coordinates: [15.9540, 120.5764],
            elevation: '28.7 meters (94.2 feet)'
        },
        {
            name: 'Oltama',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '1,487',
            coordinates: [15.9477, 120.5023],
            elevation: '24.7 meters (81.0 feet)'
        },
        {
            name: 'Palina East',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '5,144',
            coordinates: [15.9517, 120.5614],
            elevation: '28.7 meters (94.2 feet)'
        },
        {
            name: 'Palina West',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '3,386',
            coordinates: [15.9464, 120.5429],
            elevation: '24.6 meters (80.7 feet)'
        },
        {
            name: 'Pinmaludpod',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '8,166',
            coordinates: [15.9810, 120.5324],
            elevation: '25.4 meters (83.3 feet)'
        },
        {
            name: 'Poblacion',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '7,285',
            coordinates: [15.9757, 120.5660],
            elevation: '31.0 meters (101.7 feet)'
        },
        {
            name: 'San Jose',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '5,850',
            coordinates: [15.9820, 120.5048],
            elevation: '23.5 meters (77.1 feet)'
        },
        {
            name: 'San Vicente',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '9,778',
            coordinates: [15.9792, 120.5710],
            elevation: '30.0 meters (98.4 feet)'
        },
        {
            name: 'Santa Lucia',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '3,273',
            coordinates: [15.9554, 120.5550],
            elevation: '26.5 meters (86.9 feet)'
        },
        {
            name: 'Santo Domingo',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '3,610',
            coordinates: [15.9578, 120.5674],
            elevation: '28.6 meters (93.8 feet)'
        },
        {
            name: 'Sugcong',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '1,168',
            coordinates: [15.9371, 120.5297],
            elevation: '37.1 meters (121.7 feet)'
        },
        {
            name: 'Tipuso',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '2,190',
            coordinates: [15.9676, 120.6104],
            elevation: '34.4 meters (112.9 feet)'
        },
        {
            name: 'Tulong',
            region: 'Ilocos Region (Region 1)',
            province: 'Pangasinan',
            city: 'Urdaneta',
            postalCode: '2428',
            population: '1,438',
            coordinates: [16.0102, 120.5719],
            elevation: '31.7 meters (104.0 feet)'
        }



    ];

    markersData.forEach(function(data) {
        var marker = L.marker(data.coordinates);
        var popupContent = '<b>Barangay</b>: ' + data.name + '<br>' +
            '<b>Region</b>: ' + data.region + '<br>' +
            '<b>Province</b>: ' + data.province + '<br>' +
            '<b>City</b>: ' + data.city + '<br>' +
            '<b>Postal Code</b>: ' + data.postalCode + '<br>' +
            '<b>Population</b>: ' + data.population + '<br>' +
            '<b>Coordinates</b>: ' + data.coordinates[0] + ',' + data.coordinates[1] + '<br>' +
            '<b>Est. elevation abv sea lvl</b>: ' + data.elevation;

        marker.bindPopup(popupContent);

        marker.on('mouseover', function(e) {
            this.bindPopup(popupContent).openPopup();
        });

        marker.on('mouseout', function(e) {
            this.closePopup();
        });

        marker.addTo(map);
    });

    var baseMaps = {
        "Google Maps": osm,
        "Google Satellite": sat,
        "Topography": topo,
        "Dark Map": dark
    };

    var overlayMaps = {
        "Markers": singleMarker
    };

    L.control.layers(baseMaps, overlayMaps).addTo(map);