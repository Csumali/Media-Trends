function parseFile(input) {

    let file = input.files[0];
    let reader = new FileReader();
  
    reader.readAsText(file);

    reader.onload = function() {
        const parsed = parse(reader.result);
        console.log(parsed);
    };
    reader.onerror = function() {
        console.log(reader.error);
    };
}