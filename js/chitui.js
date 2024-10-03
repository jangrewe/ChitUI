var websockets = []
var printers = {}

const SDCP_MACHINE_STATUS_IDLE = 0  // Idle
const SDCP_MACHINE_STATUS_PRINTING = 1  // Executing print task
const SDCP_MACHINE_STATUS_FILE_TRANSFERRING = 2  // File transfer in progress
const SDCP_MACHINE_STATUS_EXPOSURE_TESTING = 3  // Exposure test in progress
const SDCP_MACHINE_STATUS_DEVICES_TESTING = 4  //Device self-check in progress

$( document ).ready(function() {
    getPrinters()
});

function getPrinters() {
  $.getJSON( "api.php", {
    'get': 'printers'
  })
  .done(function(data) {
    printers = data
    addPrinters(data)
    //addPrinters(printers) // REMOVE_ME: Testing
  })
  .fail(function() {
    alert( "error" )
  })
}

function addPrinters(printers) {
  $.each(printers, function(id, printer) {
    var template = $("#printersListItem").html()
    var item = $(template)
    item.attr('id', 'printer_'+ printer.mainboard)
    item.attr("data-connection-id", id)
    item.attr("data-printer-id", printer.mainboard)
    item.find(".printerName").text(printer.name)
    item.find(".printerType").text(printer.brand + ' ' + printer.model)
    item.on('click', function() {
      $.each($('.printerListItem'), function() {
        $(this).removeClass('active')
      })
      $(this).addClass('active')
      showPrinter($(this).data('connection-id'))
    })
    $("#printersList").append(item)
    connectPrinter(id, printer)
  });
}

function showPrinter(id) {
  console.log(printers)
}

function connectPrinter(id, printer) {
  var wsUrl = 'wss://'+window.location.hostname+'/ws/'+printer['ip']
  var ws = new ReconnectingWebSocket(wsUrl);
  ws.onopen = function() {
    sendRequest(id, printer, 0)
  };
  ws.onmessage = function(data) {
    msg = JSON.parse(data.data)
    handleMsg(msg)
  };
  websockets[id] = ws
}

function handleMsg(msg) {
  id = msg.Id
  topic = msg.Topic.split("/")[1]
  console.log('topic: '+ topic)
  switch(topic) {
    case 'response':
      console.log(msg)
      console.log('id: '+ id)
      break
    case 'status':
      updateStatus(msg)
      break
    default:
      break
  }
}

function updateStatus(data) {
  console.log(data)
  var info = $('#printer_'+data.MainboardID).find('.printerInfo')
  switch(data.Status.CurrentStatus[0]) {
    case SDCP_MACHINE_STATUS_IDLE:
      info.text("Idle")
      setPrinterStatus(data.MainboardID, "success")
      break
    case SDCP_MACHINE_STATUS_PRINTING:
      break
    case SDCP_MACHINE_STATUS_FILE_TRANSFERRING:
      break
    case SDCP_MACHINE_STATUS_EXPOSURE_TESTING:
      break
    case SDCP_MACHINE_STATUS_DEVICES_TESTING:
      break
    default:
      break
  }
}

function setPrinterStatus(id, style) {
  var status = $('#printer_'+id).find('.printerStatus')
  status.removeClass(function(index, css) {
    return (css.match(/\btext-\S+/g) || []).join(' ');
  }).addClass("text-"+style);
  status.find('i').removeClass().addClass('bi-circle-fill')
}

function sendRequest(id, printer, cmd) {
  var ts = new Date().getTime() / 1000;
  var payload = {
    "Id": id,
    "Data":{
      "Cmd": cmd,
      "Data": {},
      "RequestID": generateRequestId(16),
      "MainboardID": printer["mainboard"],
      "TimeStamp": ts,
      "From": 0
    },
    "Topic": "sdcp/request/"+printer["mainboard"]
  }
  websockets[id].send(JSON.stringify(payload))
}


function generateRequestId(size) {
  return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
} 

/* global bootstrap: false */
(() => {
  'use strict'
  const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    new bootstrap.Tooltip(tooltipTriggerEl)
  })
})()
