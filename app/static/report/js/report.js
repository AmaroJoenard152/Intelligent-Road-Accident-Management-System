// Global variables
let initialData = []; // Store initial table data
let filteredData = []; // Store filtered data
let fetchFilteredDataTimer = null;

let currentPage = 1;
const rowsPerPage = 10;
const maxVisiblePages = 1;

function clearForm() {
    document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], select').forEach((input) => {
        input.value = '';
    });
}
function displayCSVData(csvData) {
    const tableBody = document.querySelector('#crimeReportTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    // Parse CSV data
    Papa.parse(csvData, {
        header: true, // Treat the first row as header
        complete: function(results) {
            // Manually parse the ID field as an integer
            initialData = results.data.map(row => ({
                ...row,
                ID: parseInt(row['ID']) // Parse ID as integer
            })) || []; // Store initial data

            // Sort rows based on the "ID" column in ascending order
            initialData.sort((a, b) => a['ID'] - b['ID']);

            // Display rows based on current page
            updateTableRows();

            // Generate pagination buttons after displaying initial data
            generatePaginationButtons();
        }
    });
}

// Function to create an icon element
function createSVGIcon(svgCode, alt) {
    const icon = document.createElement('img');
    // Convert SVG code to data URL
    const svgDataURL = 'data:image/svg+xml;base64,' + btoa(svgCode);
    icon.src = svgDataURL;
    icon.alt = alt;
    return icon;
}

// Function to create a table row
function createRow(rowData) {
    if (!rowData['ID']) {
        return null; // Skip rows without ID
    }

    const newRow = document.createElement('tr');

    // Create cell for action icons
    const actionCell = document.createElement('td');
    actionCell.className = 'action-icons';

    // SVG code for the icons
    const eyeSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
            <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
            <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
        </svg>
    `;

    const deleteSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
        </svg>
    `;

    // Create view icon
    const viewIcon = createSVGIcon(eyeSVG, 'View');
    viewIcon.onclick = () => openPopup(rowData, false); // Attach click event for view
    actionCell.appendChild(viewIcon);

    // Create delete icon
    const deleteIcon = createSVGIcon(deleteSVG, 'Delete');
    deleteIcon.onclick = () => deleteRow(rowData); // Attach click event for delete
    actionCell.appendChild(deleteIcon);

    // Add other data cells
    newRow.innerHTML = `
        <td>${rowData['ID']}</td>
        <td>${rowData['BARANGAY']}</td>
        <td>${rowData['DATE COMMITTED']}</td>
        <td>${rowData['TIME COMMITTED']}</td>
        <td>${rowData['OFFENSE']}</td>
        <td>${rowData['VICTIMS COUNT']}</td>
        <td>${rowData['VEHICLE KIND']}</td>
    `;

    newRow.insertBefore(actionCell, newRow.firstChild); // Insert action cell at the beginning

    return newRow;
}
function deleteRow(rowData) {
    const idToDelete = rowData['ID'];

    // Show confirmation dialog
    const confirmation = confirm("Are you sure you want to delete this data?");

    if (confirmation) {
        fetch('/delete_row', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: idToDelete }),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message); // Log success message

            // Remove the row from the initialData array in JavaScript
            const indexToDelete = initialData.findIndex(row => row['ID'] === idToDelete);
            if (indexToDelete !== -1) {
                initialData.splice(indexToDelete, 1);

                // Update filteredData if applicable
                if (filteredData.length > 0) {
                    const filteredIndexToDelete = filteredData.findIndex(row => row['ID'] === idToDelete);
                    if (filteredIndexToDelete !== -1) {
                        filteredData.splice(filteredIndexToDelete, 1);
                    }
                }

                // Update the table rows and pagination after deletion
                if (filteredData.length > 0) {
                    updateTableRowsFiltered(); // Update table rows with filtered data
                } else {
                    updateTableRows(); // Update table rows with initial data
                }
                generatePaginationButtons(); // Regenerate pagination buttons
            }

        })
        .catch(error => console.error('Error deleting row:', error));
    } else {
        console.log('Deletion cancelled by user.');
    }
}

// Function to search data by Date Range
function searchByDateRange() {
    const startDateString = document.getElementById('startDate').value;
    const endDateString = document.getElementById('endDate').value;

    if (startDateString === '' || endDateString === '') {
        displayPopupMessage('Please select both start and end dates.');
        return;
    }

    let startDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    if (startDate > endDate) {
        displayPopupMessage('End date should be after the start date.');
        return;
    }

    // Set start date to the day before the selected start date
    startDate.setDate(startDate.getDate() - 1);

    filteredData = initialData.filter(row => {
        const dateCommitted = new Date(row['DATE COMMITTED']);
        return dateCommitted >= startDate && dateCommitted <= endDate;
    });

    if (filteredData.length === 0) {
        displayPopupMessage('No results found for the selected date range.');
        // Reset filtered data and display all initial data
        filteredData = [];
        currentPage = 1;
        updateTableRows();
        generatePaginationButtons();
    } else {
        currentPage = 1;
        updateTableRowsFiltered();
        generatePaginationButtons();
    }
}


// Update table rows based on filtered data and pagination
function updateTableRowsFiltered() {
    const tableBody = document.querySelector('#crimeReportTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows


    filteredData.forEach(rowData => {
        const newRow = createRow(rowData);
        if (newRow) {
            tableBody.appendChild(newRow);
        }
    });
}

// Update table heading based on the applied filter
function updateTableHeading(startDate, endDate) {
    const heading = document.querySelector('.crime-container h2');
    heading.textContent = `Crime Report Data (${startDate} to ${endDate})`;
}


  // Function to download CSV data based on filtered date range
function downloadCSV() {
    const startDateString = document.getElementById('startDate').value;
    const endDateString = document.getElementById('endDate').value;

    if (startDateString === '' || endDateString === '') {
        displayPopupMessage('Please select both start and end dates.');
        return;
    }

    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    // Adjust end date to be inclusive
    endDate.setDate(endDate.getDate() + 1);

    startDate.setDate(startDate.getDate() - 1);

    const filteredRows = initialData.filter(row => {
        const dateCommitted = new Date(row['DATE COMMITTED']);
        return dateCommitted >= startDate && dateCommitted <= endDate;
    });

    if (filteredRows.length === 0) {
        displayPopupMessage('No data available for the selected date range.');
        return;
    }

    const csvContent = Papa.unparse(filteredRows, {
        quotes: true,
        delimiter: ',',
        header: true
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });

    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'crimeReportData.csv';
    anchor.click();

    URL.revokeObjectURL(anchor.href);
}

// Update table rows based on initial data and pagination
function updateTableRows() {
    const tableBody = document.querySelector('#crimeReportTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const dataToShow = initialData.slice(startIndex, endIndex);

    dataToShow.forEach(rowData => {
        const newRow = createRow(rowData);
        if (newRow) {
            tableBody.appendChild(newRow);
        }
    });
}

function generatePaginationButtons() {
    const paginationContainer = document.getElementById('pagination-btns');
    paginationContainer.innerHTML = ''; // Clear existing pagination

    const dataToPaginate = filteredData.length > 0 ? filteredData : initialData; // Use filtered data if available

    const totalPages = Math.ceil(dataToPaginate.length / rowsPerPage);

    if (totalPages <= maxVisiblePages) {
        // If total pages are less than or equal to maxVisiblePages, show all pages
        for (let i = 1; i <= totalPages; i++) {
            addPaginationButton(paginationContainer, i);
        }
    } else {
        let startPage, endPage;
        if (currentPage <= Math.ceil(maxVisiblePages / 2)) {
            startPage = 1;
            endPage = maxVisiblePages;
        } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
            startPage = totalPages - maxVisiblePages + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - Math.floor(maxVisiblePages / 2);
            endPage = currentPage + Math.floor(maxVisiblePages / 2);
        }

        if (startPage < 1) {
            startPage = 1;
        }
        if (endPage > totalPages) {
            endPage = totalPages;
        }

        if (startPage > 1) {
            addPaginationButton(paginationContainer, 1); // Always show first page
            if (startPage > 2) {
                paginationContainer.appendChild(createEllipsis());
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            addPaginationButton(paginationContainer, i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationContainer.appendChild(createEllipsis());
            }
            addPaginationButton(paginationContainer, totalPages); // Always show last page
        }
    }

    const prevButton = document.createElement('button');
    prevButton.textContent = '«';
    prevButton.onclick = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };
    if (currentPage === 1) {
        prevButton.disabled = true;
    }
    paginationContainer.insertBefore(prevButton, paginationContainer.firstChild);

    const nextButton = document.createElement('button');
    nextButton.textContent = '»';
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };
    if (currentPage === totalPages) {
        nextButton.disabled = true;
    }
    paginationContainer.appendChild(nextButton);

    highlightActivePage(currentPage);
}


function addPaginationButton(container, pageNumber) {
    const button = document.createElement('button');
    button.textContent = pageNumber;
    button.onclick = () => goToPage(pageNumber);
    if (pageNumber === currentPage) {
        button.classList.add('active');
    }
    container.appendChild(button);
}

function createEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.textContent = '...';
    ellipsis.classList.add('ellipsis');
    return ellipsis;
}

// Navigate to a specific page
function goToPage(pageNumber) {
    currentPage = pageNumber;
    if (filteredData.length > 0) {
        updateTableRowsFiltered(); // Update table rows with filtered data
    } else {
        updateTableRows(); // Update table rows with initial data
    }
    generatePaginationButtons(); // Regenerate pagination buttons
}


// Highlight active page in pagination
function highlightActivePage(pageNumber) {
    const paginationButtons = document.querySelectorAll('.pagination-btns button');
    paginationButtons.forEach(button => {
        button.classList.remove('active');
        if (parseInt(button.textContent) === pageNumber) {
            button.classList.add('active');
        }
    });
}

// Function to fetch CSV data from the server and display initially
function fetchCSVDataAndDisplay() {
    fetch('/get_csv_data')
        .then(response => response.text())
        .then(data => {
            Papa.parse(data, {
                header: true,
                complete: function(results) {
                    initialData = results.data || [];
                    initialData.sort((a, b) => parseInt(a['Year Committed']) - parseInt(b['Year Committed']));
                    initialData.reverse();
                    updateTableRows(); // Update table initially
                    generatePaginationButtons();
                }
            });
        })
        .catch(error => console.error('Error fetching CSV data:', error));
}


// Function to fetch and display filtered data periodically
function fetchAndDisplayFilteredData() {
    searchByBarangay(); // Perform initial search

    // Clear any existing timer to avoid multiple timers running simultaneously
    if (fetchFilteredDataTimer) {
        clearInterval(fetchFilteredDataTimer);
    }
}


// Function to display a pop-up message
function displayPopupMessage(message) {
    alert(message); // You can replace this with your custom pop-up or use a library for more styling
}


// Function to search data by Barangay
function searchByBarangay() {
    const selectedBarangay = document.getElementById('barangayDropdown').value;
    if (selectedBarangay === '') {
        displayPopupMessage('Choose a Barangay to search first');
    } else {
        filteredData = initialData.filter(row => row['BARANGAY'] === selectedBarangay);
        if (filteredData.length === 0) {
            displayPopupMessage('No results found for the selected Barangay.');
            // Reset filtered data and display all initial data
            filteredData = [];
            currentPage = 1;
            updateTableRows();
            generatePaginationButtons();
        } else {
            currentPage = 1;
            updateTableRowsFiltered();
            generatePaginationButtons();
        }
    }
}


// Update table rows based on filtered data and pagination
function updateTableRowsFiltered() {
    const tableBody = document.querySelector('#crimeReportTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const dataToShow = filteredData.slice(startIndex, endIndex);

    dataToShow.forEach(rowData => {
        const newRow = createRow(rowData);
        if (newRow) {
            tableBody.appendChild(newRow);
        }
    });
}
function validateWindDirection(input) {
    var value = input.value.trim(); // Trim whitespace
    if (value === "") {
        input.setCustomValidity(""); // Clear custom validation message if field is empty
        document.getElementById("errorMessage").style.display = "none"; // Hide error message
    } else {
        var intValue = parseInt(value);
        if (isNaN(intValue) || intValue < 0 || intValue > 360) {
            document.getElementById("errorMessage").style.display = "block";
            input.setCustomValidity("Invalid input. Please enter a wind direction between 0 and 360.");
        } else {
            document.getElementById("errorMessage").style.display = "none";
            input.setCustomValidity("");
        }
    }
}

function clearAndRefresh() {
    // Clear input fields
    document.getElementById('barangayDropdown').selectedIndex = 0;
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';

    // Reset filtered data (if applicable)
    filteredData = [];

    // Reset current page to 1
    currentPage = 1;

    // Refresh table with initial data
    updateTableRows();
    generatePaginationButtons();
}


function formatDate(dateString) {
    const dateObject = new Date(dateString);
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(dateObject.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function openPopup(rowData) {
    console.log("rowData:", rowData); // Check the structure of rowData
    const id = rowData['ID'];
    const crimeType = rowData['OFFENSE'];
    const date = rowData['DATE COMMITTED'];
    const time = rowData['TIME COMMITTED'];
    const victimAge = rowData['VICTIMS Age'];
    // const victimGender = rowData['VICTIMS Gender'];
    const suspectAge = rowData['SUSPECTS Age'];
    // const suspectGender = rowData['SUSPECTS Gender'];
    const victimCount = rowData['VICTIMS COUNT'];
    const suspectCount = rowData['SUSPECTS COUNT'];
    const vehicleKind = rowData['VEHICLE KIND'];
    const longitude = rowData['LONGITUDE'];
    const latitude = rowData['LATITUDE'];
    const rainfall = rowData['RAINFALL'];
    const tmax = rowData['TMAX'];
    const tmin = rowData['TMIN'];
    const windSpeed = rowData['WIND_SPEED'];
    const windDirection = rowData['WIND_DIRECTION'];
    // const location = rowData['BARANGAY']; // Ensure this key is correct

    // Set values for non-dropdown elements
    document.getElementById('idPop').value = id;
    document.getElementById('crimeTypePop').value = crimeType;
    document.getElementById('datePop').value = formatDate(date);
    document.getElementById('timePop').value = time;
    document.getElementById('victimAgePop').value = victimAge;
    // document.getElementById('victimGenderPop').value = victimGender;
    document.getElementById('suspectAgePop').value = suspectAge;
    // document.getElementById('suspectGenderPop').value = suspectGender;
    document.getElementById('victimCountPop').value = victimCount;
    document.getElementById('suspectCountPop').value = suspectCount;
    document.getElementById('vehicleKindPop').value = vehicleKind;
    document.getElementById('longitudePop').value = longitude;
    document.getElementById('latitudePop').value = latitude;
    document.getElementById('rainfallPop').value = rainfall;
    document.getElementById('tmaxPop').value = tmax;
    document.getElementById('tminPop').value = tmin;
    document.getElementById('windSpeedPop').value = windSpeed;
    document.getElementById('windDirectionPop').value = windDirection;

    const victimGenders = ["M", "F"];
    const suspectGenders = ["M", "F"];
    const barangays = [
        "Anonas",
        "Bactad East",
        "Bayaoas",
        "Bolaoen",
        "Cabaruan",
        "Cabuloan", // new
        "Camanang",
        "Camantiles",
        "Casantaan", // new
        "Catablan",
        "Cayambanan",
        "Consolacion",
        "Dilan Paurido",
        "Dr. Pedro T. Orata (Bactad Proper)",
        "Labit Proper",
        "Labit West", // new
        "Mabanogbog",
        "Macalong",
        "Nancalobasaan",
        "Nancamaliran East",
        "Nancamaliran West",
        "Nancayasan",
        "Oltama", // new
        "Palina East",
        "Palina West",
        "Pinmaludpod",
        "Poblacion",
        "San Jose",
        "San Vicente",
        "Santa Lucia",
        "Santo Domingo",
        "Sugcong", // new
        "Tipuso", // new
        "Tulong" // new
    ];

    populateDropdown('locationPop', barangays);
    populateDropdown('victimGenderPop', victimGenders);
    populateDropdown('suspectGenderPop', suspectGenders);

    setDropdownValue('locationPop', rowData['BARANGAY']);
    setDropdownValue('victimGenderPop', rowData['VICTIMS Gender']);
    setDropdownValue('suspectGenderPop', rowData['SUSPECTS Gender']);

    const saveButton = document.getElementById('saveButtonPop');
    saveButton.addEventListener('click', saveChanges);

    const cancelButton = document.getElementById('cancelButtonPop');
    cancelButton.addEventListener('click', closePopup);

    // Show the overlay and popup
    const overlay = document.getElementById('overlay');
    const popup = document.getElementById('viewPopup');
    overlay.style.display = 'block';
    popup.style.display = 'block';
}
function setDropdownValue(dropdownId, selectedValue) {
    const dropdown = document.getElementById(dropdownId);
    for (let i = 0; i < dropdown.options.length; i++) {
        if (dropdown.options[i].value === selectedValue) {
            dropdown.selectedIndex = i;
            break;
        }
    }
}
function populateDropdown(dropdownId, options) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = ""; // Clear existing options
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.text = option;
        dropdown.add(optionElement);
    });
}

function saveChanges() {
    const editedData = {
        id: document.getElementById('idPop').value,
        crimeType: document.getElementById('crimeTypePop').value,
        date: formatDate(document.getElementById('datePop').value),
        time: document.getElementById('timePop').value,
        victimAge: document.getElementById('victimAgePop').value,
        victimGender: document.getElementById('victimGenderPop').value,
        victimCount: document.getElementById('victimCountPop').value,
        suspectAge: document.getElementById('suspectAgePop').value,
        suspectCount: document.getElementById('suspectCountPop').value,
        suspectGender: document.getElementById('suspectGenderPop').value,
        vehicleKind: document.getElementById('vehicleKindPop').value,
        longitude: document.getElementById('longitudePop').value,
        latitude: document.getElementById('latitudePop').value,
        rainfall: document.getElementById('rainfallPop').value,
        tmax: document.getElementById('tmaxPop').value,
        tmin: document.getElementById('tminPop').value,
        windSpeed: document.getElementById('windSpeedPop').value,
        windDirection: document.getElementById('windDirectionPop').value,
        location: document.getElementById('locationPop').value
    };

    // Send the edited data to the Flask backend
    fetch('/edit_row', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedData)
    })
    .then(response => {
        if (response.ok) {
            console.log('Data saved successfully');
            // Optionally, close the popup or perform any other action
        } else {
            console.error('Failed to save data');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function closePopup() {
    const overlay = document.getElementById('overlay');
    const popup = document.getElementById('viewPopup');
    overlay.style.display = 'none';
    popup.style.display = 'none';
}

// Fetch CSV data from the server and display initially
fetchCSVDataAndDisplay();