document.addEventListener("DOMContentLoaded", async function () {
    console.log('DOM fully loaded and parsed');


    const storedTech = localStorage.getItem('fieldTech');
    const displayNameElement = document.getElementById('displayName');
    const techDropdown = document.getElementById('techDropdown'); // Get the dropdown element
    const searchBar = document.getElementById('searchBar'); // Reference to the search bar
    const loadingBar = document.getElementById('loadingBar'); // Reference to the loading bar element
    const airtableApiKey = 'pata9Iv7DANqtJrgO.b308b33cd0f323601f3fb580aac0d333ca1629dd26c5ebe2e2b9f18143ccaa8e';
    const airtableBaseId = 'appQDdkj6ydqUaUkE';
    const airtableTableName = 'tblO72Aw6qplOEAhR';
    const airtableEndpoint = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;

    axios.defaults.headers.common['Authorization'] = `Bearer ${airtableApiKey}`;

    let technicianRecords = []; // Store records fetched for the logged-in technician
    let isLoading = true; // Variable to track whether the page is still loading

    // Disable the dropdown initially while loading
    techDropdown.disabled = true;
    const cacheTime = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    const lastFetch = localStorage.getItem('lastTechFetchTime');
    const currentTime = new Date().getTime();

    // Function to hide search bar if less than 6 records
    function toggleSearchBarVisibility(records) {
        if (records.length < 6) {
            searchBar.style.display = 'none';  // Hide the search bar if there are less than 6 records
        } else {
            searchBar.style.display = 'block';  // Show the search bar if there are 6 or more records
        }
    }

    let loadingBarTimeout; // To store the timeout reference
    let loadingStartTime;  // To track when loading started
    
    // Show the loading bar after a 3-second delay
    function showLoadingBar() {
        loadingStartTime = Date.now();
        loadingBarTimeout = setTimeout(() => {
            const loadingBarContainer = document.getElementById('loadingBarContainer');
            loadingBarContainer.style.display = 'block'; // Show the loading bar
            console.log("Loading bar displayed after 3 seconds");
        }, 3000); // Delay for 3 seconds
    }

    // Function to handle search input and filter table rows
function filterTable() {
    const searchTerm = searchBar.value.toLowerCase(); // Get the search term and convert to lowercase
    const recordsTable = document.querySelector('#records'); // Correct selector
    const rows = recordsTable.getElementsByTagName('tr'); // Get all rows of the table

    // Loop through all rows except the first one (which is the table header)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        let rowContainsTerm = false; // Flag to check if the row contains the search term

        // Loop through each cell in the row
        const cells = row.getElementsByTagName('td');
        for (let j = 0; j < cells.length; j++) {
            const cellText = cells[j].textContent.toLowerCase(); // Get the cell's text and convert to lowercase
            if (cellText.includes(searchTerm)) { // Check if cell contains the search term
                rowContainsTerm = true; // Set flag to true if term is found
                break; // Exit the loop since we only need one match per row
            }
        }

        // Show or hide the row based on whether it contains the search term
        row.style.display = rowContainsTerm ? '' : 'none';
    }
}

// Add an event listener for the search bar input event
searchBar.addEventListener('input', filterTable);

    
    // Hide the loading bar immediately when loading is complete
    function hideLoadingBar() {
        const loadingBarContainer = document.getElementById('loadingBarContainer');
        
        // Check if loading finished in less than 3 seconds
        const elapsedTime = Date.now() - loadingStartTime;
        if (elapsedTime < 3000) {
            console.log("Loading completed in less than 3 seconds, not showing the loading bar.");
            clearTimeout(loadingBarTimeout); // Cancel showing the loading bar if loading finishes quickly
        } else {
            loadingBarContainer.style.display = 'none'; // Hide if the bar was shown
            console.log("Loading bar hidden.");
        }
    }

     

            // Function to display a message when user interacts with the dropdown during loading
    function showLoadingMessage() {
        if (isLoading) {
            alert("The page is still loading. Please wait until the data is fully loaded.");
        }
    }
       // Add a listener to prevent dropdown interaction during loading
       techDropdown.addEventListener('click', showLoadingMessage);
// Function to update the loading bar progress and display "Loading X out of Y"
function updateLoadingBar(current, total) {
    const loadingBar = document.getElementById('loadingBar');
    const loadingStatus = document.getElementById('loadingPercentage');

    // Update the text to show "Loading X out of Y"
    loadingStatus.innerText = `Loading ${current} out of ${total}`;

    console.log(`Loading status updated: Loading ${current} out of ${total}.`);

    // Optionally, update the bar width for a visual representation of progress
    const percentage = Math.min(Math.round((current / total) * 100), 100); // Calculate percentage
    loadingBar.style.width = `${percentage}%`;  // Update bar width
}

    
  // Fetch and display records
async function fetchAndDisplayRecords() {
    const recordsTableBody = document.querySelector('#records tbody');

    if (!recordsTableBody) {
        console.error("Error: The #records tbody element does not exist in the DOM.");
        return;
    }

    recordsTableBody.innerHTML = ''; // Clear any existing records

    try {
        console.log("Starting to fetch records from Airtable...");

        // Show the loading bar at the beginning of the process
        showLoadingBar();

        // Disable the dropdown while records are loading
        techDropdown.disabled = true;

        let totalRecords = 0;
        let fetchedRecords = 0;
        let records = [];
        let offset = '';

        // Step 1: Fetch all records and calculate the total number of records at the same time
        console.log("Fetching and calculating total number of records...");
        
        // First, we calculate the total number of records
     // Step 1: Calculate total number of records
do {
    const response = await axios.get(`${airtableEndpoint}?filterByFormula=AND(NOT({Field Tech Confirmed Job Complete}), {VPO Status} = 'Awaiting Field Tech Complete Confirmation')&offset=${offset}`);
    const pageRecords = response.data.records;
    totalRecords += pageRecords.length;
    records = records.concat(pageRecords);

    offset = response.data.offset || ''; // Move to the next page of results
} while (offset);

console.log(`Total records to fetch: ${totalRecords}`);

// Step 2: Fetch and display records (batch if more than 50 records)
if (totalRecords <= 50) {
    // Fetch all records at once if less than or equal to 50
    console.log(`Fetching all records at once (total: ${totalRecords})`);

    // Display all records at once
    displayRecordsWithFadeIn(records);
    updateLoadingBar(totalRecords, totalRecords); // Set loading to 100% when done
} else {
    // Batch fetching for more than 50 records
    console.log("Batch fetching records...");

    let fetchedRecords = 0;
    let offset = '';

    do {
        const response = await axios.get(`${airtableEndpoint}?filterByFormula=AND(NOT({Field Tech Confirmed Job Complete}), {VPO Status} = 'Awaiting Field Tech Complete Confirmation')&offset=${offset}`);
        const pageRecords = response.data.records;
        records = records.concat(pageRecords);
        fetchedRecords += pageRecords.length;

        // Update the loading bar and display the number of fetched records
        updateLoadingBar(fetchedRecords, totalRecords);

        // Add a delay before displaying the fetched records (batching for large sets)
        await delayDisplay(1000); // Delay by 1000 milliseconds

        // Display the fetched records so far in batches
        displayRecordsWithFadeIn(pageRecords);

        offset = response.data.offset || ''; // Move to the next page of results
        console.log(`Fetched ${fetchedRecords} records so far.`);
    } while (offset);
}

// Helper function to add delay
function delayDisplay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

        // Hide the loading bar once fetching is complete
        hideLoadingBar();
        console.log("Finished fetching all records.");

        // Enable the dropdown after records have loaded
        techDropdown.disabled = false;
        techDropdown.removeEventListener('click', showLoadingMessage);

        console.log(`Total number of records displayed: ${records.length}`);
    } catch (error) {
        console.error('Error fetching records:', error);
        hideLoadingBar(); // Hide the loading bar in case of error

        // Re-enable the dropdown in case of an error to allow user to try again
        techDropdown.disabled = false;
        techDropdown.removeEventListener('click', showLoadingMessage);
    }
}



// Call this function on page load
document.addEventListener("DOMContentLoaded", async function () {
    console.log("DOM fully loaded, triggering record fetch...");
    await fetchAndDisplayRecords();
});


    // Fetch unique technician names with at least one incomplete record from Airtable
    async function fetchTechniciansWithRecords() {
        try {
            let techniciansWithRecords = new Set(); // Use a Set to ensure uniqueness
            let offset = '';

            // Fetch all records
            do {
                const response = await axios.get(`${airtableEndpoint}?offset=${offset}`);
                const records = response.data.records;

                // Process each record and add the technician name if they have a record
                records.forEach(record => {
                    const techName = record.fields['static Field Technician'];
                    const isJobComplete = record.fields['Field Tech Confirmed Job Complete'];
                    if (techName && !isJobComplete) {  // Only include technicians with incomplete jobs
                        techniciansWithRecords.add(techName); // Add technician name to the Set
                    }
                });

                offset = response.data.offset || ''; // Move to the next page of results
            } while (offset);

            return Array.from(techniciansWithRecords).sort(); // Convert the Set to an Array and sort alphabetically
        } catch (error) {
            console.error('Error fetching technicians:', error);
            return [];
        }
    }
      // Function to hide search bar if less than 6 records
      function toggleSearchBarVisibility(records) {
        if (records.length < 6) {
            searchBar.style.display = 'none';  // Hide the search bar if there are less than 6 records
        } else {
            searchBar.style.display = 'block';  // Show the search bar if there are 6 or more records
        }
    }

// Function to show the loading bar and reset the status
function showLoadingBar() {
    const loadingBarContainer = document.getElementById('loadingBarContainer');
    loadingBarContainer.style.display = 'block'; // Show the loading bar container
    const loadingBar = document.getElementById('loadingBar');
    loadingBar.style.width = '0%'; // Reset the loading bar width
    const loadingStatus = document.getElementById('loadingPercentage');
    loadingStatus.innerText = 'Loading 0 out of 0'; // Reset the text
    console.log("Loading bar shown with initial text.");
}

// Function to hide the loading bar
function hideLoadingBar() {
    const loadingBarContainer = document.getElementById('loadingBarContainer');
    loadingBarContainer.style.display = 'none'; // Hide the loading bar container
    console.log("Loading bar hidden.");
}



    async function populateDropdown() {
        showLoadingBar();  // Show loading bar when dropdown starts populating
        
        const cachedTechnicians = JSON.parse(localStorage.getItem('technicians'));
    
        // If cached technicians exist, load them into the dropdown first
        if (cachedTechnicians && cachedTechnicians.length > 0) {
            populateDropdownFromCache(cachedTechnicians);
            console.log('Dropdown populated from cache');
        }
    
        // Check cache expiration or if no cache is available
        if (!cachedTechnicians || !lastFetch || currentTime - lastFetch > cacheTime) {
            // Immediately fetch fresh technician names from Airtable if the cache is empty or expired
            const technicians = await fetchTechniciansWithRecords();
            localStorage.setItem('technicians', JSON.stringify(technicians));
            localStorage.setItem('lastTechFetchTime', currentTime.toString());
    
            // Update dropdown after fetching new data
            populateDropdownFromCache(technicians);
            console.log('Dropdown updated with fresh data');
        }
    
        // Automatically trigger the record fetching for the default selection
        const storedTech = localStorage.getItem('fieldTech');
        if (storedTech === "all" || !storedTech) {
            fetchAllIncompleteRecords(); // Fetch all records if "all" or no tech is selected
        } else {
            fetchRecordsForTech(storedTech); // Fetch records for the stored technician
        }
    
        hideLoadingBar(); // Hide loading bar once dropdown is populated
    }
    
    
    function populateDropdownFromCache(technicians) {
        const previouslySelectedTech = localStorage.getItem('fieldTech') || '';
    
        techDropdown.innerHTML = `
            <option value="">Select a Technician</option>
            <option value="all">Display All</option>
        `;
    
        technicians.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech;
            option.innerText = tech;
            techDropdown.appendChild(option);
        });
    
        // Set the dropdown to the previously selected technician
        if (previouslySelectedTech) {
            techDropdown.value = previouslySelectedTech;
        }
    }
    
    // Call populateDropdown immediately when DOM is ready
    document.addEventListener("DOMContentLoaded", async function () {
        console.log("DOM fully loaded, populating dropdown...");
        await populateDropdown();
    });

        // Call populateDropdown immediately when DOM is ready
        document.addEventListener("DOMContentLoaded", async function () {
            console.log("DOM fully loaded, populating dropdown...");
            await populateDropdown();  // Populate the dropdown and show loading bar until done
        });
    
    // Define the fetchAllIncompleteRecords function
    async function fetchAllIncompleteRecords() {
        try {
            showLoadingBar();
            console.log(`Fetching all incomplete records from Airtable...`);
    
            let records = [];
            let fetchedRecords = 0;
            let totalIncompleteRecords = 0;
            let offset = '';
    
            // Step 1: Calculate total number of incomplete records
            console.log("Calculating total number of incomplete records...");
            do {
                const response = await axios.get(`${airtableEndpoint}?filterByFormula=NOT({Field Tech Confirmed Job Complete})&offset=${offset}`);
                const incompleteRecords = response.data.records.filter(record => !record.fields['Field Tech Confirmed Job Complete']);
                totalIncompleteRecords += incompleteRecords.length; // Count only incomplete records
                offset = response.data.offset || ''; // Move to the next page of results
            } while (offset);
    
            console.log(`Total incomplete records to fetch: ${totalIncompleteRecords}`);
    
            // Reset the offset to start fetching records
            offset = '';
    
            // Step 2: Fetch records and update the loading bar
            do {
                const response = await axios.get(`${airtableEndpoint}?filterByFormula=NOT({Field Tech Confirmed Job Complete})&offset=${offset}`);
                const pageRecords = response.data.records.filter(record => !record.fields['Field Tech Confirmed Job Complete'])
                    .map(record => ({
                        id: record.id,
                        fields: record.fields,
                        descriptionOfWork: record.fields['Description of Work']
                    }));
    
                records = records.concat(pageRecords);
                fetchedRecords += pageRecords.length;
    
                // Update the loading bar with current progress
                updateLoadingBar(fetchedRecords, totalIncompleteRecords);
    
                offset = response.data.offset || ''; // Move to the next page of results
                console.log(`Fetched ${fetchedRecords} records so far.`);
            } while (offset);
    
            // Hide the loading bar once fetching is complete
            hideLoadingBar();
    
            // Populate the table with the fetched records
            toggleSearchBarVisibility(records); // Hide search bar if fewer than 6 records
            displayRecordsWithFadeIn(records); // Display records with fade-in effect
    
            console.log(`Fetched ${records.length} incomplete records.`);
        } catch (error) {
            console.error('Error fetching all incomplete records:', error);
        } finally {
            hideLoadingBar(); // Hide the loading bar after fetching is complete
        }
    }
    



// Fetch records for a selected technician
async function fetchRecordsForTech(fieldTech) {
    try {
        showLoadingBar(); // Show the loading bar

        console.log(`Fetching records for ${fieldTech} from Airtable...`);
    
        let records = [];
        let fetchedRecords = 0;
        let totalIncompleteRecords = 0;
        let offset = '';
    
        // Step 1: Calculate total number of incomplete records for the selected technician
        console.log(`Calculating total number of incomplete records for ${fieldTech}...`);
        const filterByFormula = `SEARCH("${fieldTech}", {static Field Technician})`;
        do {
            const response = await axios.get(`${airtableEndpoint}?filterByFormula=${encodeURIComponent(filterByFormula)}&offset=${offset}`);
            const incompleteRecords = response.data.records.filter(record => !record.fields['Field Tech Confirmed Job Complete']);
            totalIncompleteRecords += incompleteRecords.length; // Count only incomplete records
            offset = response.data.offset || ''; // Move to the next page of results
        } while (offset);
    
        console.log(`Total incomplete records for ${fieldTech}: ${totalIncompleteRecords}`);
    
        // Step 2: Fetch records and update the loading bar
        offset = ''; // Reset the offset to fetch records again
        do {
            const response = await axios.get(`${airtableEndpoint}?filterByFormula=${encodeURIComponent(filterByFormula)}&offset=${offset}`);
            const pageRecords = response.data.records.filter(record => !record.fields['Field Tech Confirmed Job Complete'])
                .map(record => ({
                    id: record.id,
                    fields: record.fields,
                    descriptionOfWork: record.fields['Description of Work']
                }));
            records = records.concat(pageRecords);
            fetchedRecords += pageRecords.length;

            // Update the loading bar based on the percentage of records fetched
            updateLoadingBar(fetchedRecords, totalIncompleteRecords);
    
            offset = response.data.offset || ''; // Move to the next page of results
            console.log(`Fetched ${fetchedRecords} records so far.`);
        } while (offset);

        // Ensure the loading bar ends at 100%
        updateLoadingBar(totalIncompleteRecords, totalIncompleteRecords); // Set loading to 100% when done
    
        toggleSearchBarVisibility(records); // Hide search bar if fewer than 6 records
        displayRecordsWithFadeIn(records); // Display the selected technician's records with fade-in effect
        console.log(`Fetched ${records.length} incomplete records for ${fieldTech}.`);
        
        // Call hideFieldTechnicianColumnIfMatches after populating the records
        hideFieldTechnicianColumnIfMatches();
    
    } catch (error) {
        console.error(`Error fetching records for technician ${fieldTech}:`, error);
    } finally {
        hideLoadingBar(); // Hide the loading bar after fetching is complete
    }
}



    
    // Function to display records with fade-in effect
    function displayRecordsWithFadeIn(records) {
        console.log('Displaying records...');
        const recordsContainer = document.getElementById('records');
        recordsContainer.innerHTML = '';

        if (records.length === 0) {
            recordsContainer.innerText = 'No records found.';
            return;
        }

        records = sortRecordsWithSpecialCondition(records);

        const tableHeader = `
            <thead>
                <tr>
                    <th style="width: 8%;">ID Number</th>
                    <th>Branch</th>
                    <th>Job Name</th>
                    <th>Description of Work</th>
                    <th>Field Technician</th>
                    <th style="width: 13%;">Completed</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        recordsContainer.innerHTML = tableHeader;
        const tableBody = recordsContainer.querySelector('tbody');

        // Use setTimeout to create a fade-in effect for each record
        records.forEach((record, index) => {
            const recordRow = createRecordRow(record);
            recordRow.style.opacity = 0; // Initially set opacity to 0 for fade-in effect

            setTimeout(() => {
                recordRow.style.opacity = 1; // Fade-in effect
                recordRow.style.transition = 'opacity 0.5s'; // Apply CSS transition for smooth fade-in
            }, index * 100); // Delay each row by 100ms

            tableBody.appendChild(recordRow);
        });

        console.log(`Total number of entries displayed: ${records.length}`);
    }


    function sortRecordsWithSpecialCondition(records) {
        return records.sort((a, b) => {
            const idA = a.fields['ID Number'] || ''; // Fetch the ID Number field from record A
            const idB = b.fields['ID Number'] || ''; // Fetch the ID Number field from record B
    
            // If ID Numbers are numeric, compare numerically
            const numA = parseInt(idA, 10);
            const numB = parseInt(idB, 10);
    
            // If both IDs are valid numbers, sort numerically
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
    
            // If IDs are not numbers or not comparable numerically, fall back to lexicographical sort
            return idA.localeCompare(idB);
        });
    }
    

    function createRecordRow(record) {
        const recordRow = document.createElement('tr');
        const IDNumber = record.fields['ID Number'] || '';
        const vanirOffice = record.fields['static Vanir Office'] || '';
        const jobName = record.fields['Job Name'] || '';
        const fieldTechnician = record.fields['static Field Technician'] || '';
        const fieldTechConfirmedComplete = record.fields['Field Tech Confirmed Job Complete'];
        const checkboxValue = fieldTechConfirmedComplete ? 'checked' : '';
        const descriptionOfWork = record.descriptionOfWork || '';

        recordRow.innerHTML = `
            <td>${IDNumber}</td>
            <td>${vanirOffice}</td>
            <td>${jobName}</td>
            <td>${descriptionOfWork}</td>
            <td>${fieldTechnician}</td>
            <td>
                <label class="custom-checkbox">
                    <input type="checkbox" ${checkboxValue} data-record-id="${record.id}" data-initial-checked="${checkboxValue}">
                    <span class="checkmark"></span>
                </label>
            </td>
        `;

        const checkbox = recordRow.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('click', handleCheckboxClick);

        return recordRow;
    }
    const modal = document.getElementById('modal');  // Reference the modal element
    const yesButton = document.getElementById('yesButton');
    const noButton = document.getElementById('noButton');
    
    function hideFieldTechnicianColumnIfMatches() {
        const selectedTech = techDropdown.value; // Get the selected technician from the dropdown
        const rows = document.querySelectorAll('#records tbody tr'); // Get all table rows
    
        // Get the "Field Technician" and "Branch" headers and cells
        const fieldTechHeader = document.querySelector('th:nth-child(5)');
        const branchHeader = document.querySelector('th:nth-child(2)');
        const fieldTechCells = document.querySelectorAll('td:nth-child(5)');
        const branchCells = document.querySelectorAll('td:nth-child(2)');
    
        // If "all" is selected, show both "Field Technician" and "Branch" columns
        if (selectedTech === "all") {
            fieldTechHeader.style.display = ''; // Show the Field Technician header
            fieldTechCells.forEach(cell => {
                cell.style.display = ''; // Show each Field Technician cell in the column
            });
            
            branchHeader.style.display = ''; // Show the Branch header
            branchCells.forEach(cell => {
                cell.style.display = ''; // Show each Branch cell in the column
            });
        } else {
            // Hide both "Field Technician" and "Branch" columns when a specific technician is selected
            fieldTechHeader.style.display = 'none'; // Hide the Field Technician header
            fieldTechCells.forEach(cell => {
                cell.style.display = 'none'; // Hide each Field Technician cell in the column
            });
    
            branchHeader.style.display = 'none'; // Hide the Branch header
            branchCells.forEach(cell => {
                cell.style.display = 'none'; // Hide each Branch cell in the column
            });
        }
    }
    
    // Call the function when the dropdown changes
// Handle dropdown change event
techDropdown.addEventListener('change', () => {
    const selectedTech = techDropdown.value;
    
    // Reset loading bar and fetch records based on dropdown selection
    showLoadingBar(); // Reset and show the loading bar
    updateLoadingBar(0, 100); // Set loading bar to 0% initially

    if (selectedTech === "all") {
        fetchAllIncompleteRecords(); // Fetch and display all incomplete records
    } else if (selectedTech) {
        localStorage.setItem('fieldTech', selectedTech);
        displayNameElement.innerText = `Logged in as: ${selectedTech}`;
        fetchRecordsForTech(selectedTech); // Fetch records for the selected technician
    }
    hideFieldTechnicianColumnIfMatches(); // Check and hide the Field Technician column if applicable
});
    
    // Call the function on page load to hide/show the columns based on the current selection
    document.addEventListener("DOMContentLoaded", () => {
        hideFieldTechnicianColumnIfMatches();
    });
    
    
    
    
    // Call the function when the dropdown changes
    let currentCheckbox = null; // Declare at a higher scope
    let currentRecordId = null;  // Declare at a higher scope
    
    // Function to handle checkbox click event
    function handleCheckboxClick(event) {
        currentCheckbox = event.target;  // Assign current checkbox globally
        currentRecordId = currentCheckbox.getAttribute('data-record-id');
        const isChecked = currentCheckbox.checked;
        const initialChecked = currentCheckbox.getAttribute('data-initial-checked') === 'true';
    
        if (!isChecked) {
            // Checkbox was unchecked: immediately submit the update without showing the modal
            console.log('Checkbox unchecked, submitting update immediately...');
            submitUpdate(currentRecordId, false); // Uncheck action, no modal
            modal.style.display = 'none'; // Hide the modal when unchecked
        } else if (!initialChecked && isChecked) {
            // Checkbox was initially unchecked and is now checked: Show the modal for confirmation
            console.log('Checkbox checked, showing modal for confirmation...');
            modal.style.display = 'block'; // Show the modal when checked
        }
    
        // Update the checkbox's 'data-initial-checked' attribute to its current state after interaction
        currentCheckbox.setAttribute('data-initial-checked', isChecked);
    }
    
    // Event listeners for modal buttons
    yesButton.addEventListener('click', () => {
        submitUpdate(currentRecordId, true);  // Use the globally declared currentRecordId
        modal.style.display = 'none';
    });
    
    noButton.addEventListener('click', () => {
        if (currentCheckbox) {
            currentCheckbox.checked = false;  // Uncheck the checkbox if "No" is clicked
        }
        modal.style.display = 'none';
    });
    

    async function submitUpdate(recordId, isChecked) {
        console.log(`Submitting update for record ID ${recordId}...`);
    
        try {
            // Send the update to Airtable
            await axios.patch(`${airtableEndpoint}/${recordId}`, {
                fields: {
                    'Field Tech Confirmed Job Complete': isChecked,
                    'Field Tech Confirmed Job Completed Date': isChecked ? new Date().toISOString() : null
                }
            });
    
            if (isChecked) {
                // Only show alert if the job is confirmed complete (checked)
                console.log(`Record ID ${recordId} marked as complete.`);
                alert(`Record ID ${recordId} updated successfully.`);
            } else {
                // Log for uncheck, no alert needed
                console.log(`Record ID ${recordId} marked as incomplete.`);
            }
    
            // Dynamically update the UI instead of reloading
            updateCheckboxUI(recordId, isChecked);
    
            // Add page refresh after successful submission
            location.reload();
    
        } catch (error) {
            console.error('Error updating record:', error);
        }
    }
    
    
    function updateCheckboxUI(recordId, isChecked) {
        // Find the checkbox element using the record ID
        const checkbox = document.querySelector(`input[data-record-id="${recordId}"]`);
    
        if (checkbox) {
            // Update the checkbox state
            checkbox.checked = isChecked;
    
            // Optionally update any other UI elements (e.g., change labels or text)
            const row = checkbox.closest('tr'); // Assuming the checkbox is inside a row
            const statusCell = row.querySelector('.status-cell'); // Assuming there's a status cell to update
            if (statusCell) {
                statusCell.textContent = isChecked ? 'Complete' : 'Incomplete';
            }
        }
    }
    

     // Handle dropdown change event
     techDropdown.addEventListener('change', () => {
        const selectedTech = techDropdown.value;
        if (selectedTech === "all") {
            fetchAllIncompleteRecords(); // Fetch and display all incomplete records
        } else if (selectedTech) {
            localStorage.setItem('fieldTech', selectedTech);
            displayNameElement.innerText = `Logged in as: ${selectedTech}`;
            fetchRecordsForTech(selectedTech); // Re-fetch records for the selected technician
        }
        hideFieldTechnicianColumnIfMatches(); // Check and hide the Field Technician column if applicable
    });
    
    // Populate dropdown with unique technician names on page load
    await populateDropdown(); // Populate the dropdown and show loading bar until done

    await fetchAndDisplayRecords();


    // Fetch records for the logged-in technician on page load if available
    if (storedTech && storedTech !== "all") {
        fetchRecordsForTech(storedTech);
    } else if (storedTech === "all") {
        fetchAllIncompleteRecords(); // Fetch all incomplete records if "Display All" was previously selected
    }
});