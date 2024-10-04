const socket = io();
var websockets = []
var printers = {}

socket.on("connect", () => {
  console.log('socket.io connected: ' + socket.id);
  setServerStatus(true)
});

socket.on("disconnect", () => {
  console.log("socket.io disconnected"); // undefined
  setServerStatus(false)
});

socket.on("printers", (data) => {
  console.log(JSON.stringify(data))
  printers = data
  $("#printersList").empty()
  addPrinters(data)
});

socket.on("printer_response", (data) => {
  switch (data.Data.Cmd) {
    case SDCP_CMD_STATUS:
    case SDCP_CMD_ATTRIBUTES:
      //console.log(JSON.stringify(data))
      break
    case SDCP_CMD_RETRIEVE_FILE_LIST:
      handle_printer_files(data.Data.MainboardID, data.Data.Data.FileList)
      break
    default:
      console.log(data)
      break
  }
});

socket.on("printer_error", (data) => {
  console.log("=== ERROR ===")
  console.log(data)
  alert("Error Code:" + data.Data.Data.ErrorCode)
});

socket.on("printer_notice", (data) => {
  console.log("=== NOTICE ===")
  console.log(data)
  alert("Notice:" + data.Data.Data.Message)
});

socket.on("printer_status", (data) => {
  //console.log(JSON.stringify(data))
  var fields = {}
  var filter = ['CurrentStatus', 'PrintScreen', 'ReleaseFilm', 'TempOfUVLED', 'TimeLapseStatus', 'PrintInfo']
  $.each(data.Status, function (key, val) {
    if (filter.includes(key)) {
      fields[key] = val
    }
  })
  printers[data.MainboardID]['status'] = fields
  updatePrinterStatus(data)
});

socket.on("printer_attributes", (data) => {
  //console.log(JSON.stringify(data))
  var fields = {}
  var filter = ['Resolution', 'XYZsize', 'NumberOfVideoStreamConnected', 'MaximumVideoStreamAllowed', 'UsbDiskStatus', 'Capabilities', 'SupportFileType', 'DevicesStatus', 'ReleaseFilmMax', 'CameraStatus', 'RemainingMemory', 'TLPNoCapPos', 'TLPStartCapPos', 'TLPInterLayers']
  $.each(data.Attributes, function (key, val) {
    if (filter.includes(key)) {
      fields[key] = val
    }
  })
  printers[data.MainboardID]['attributes'] = fields
  //updatePrinterAttributes(data)
});

function handle_printer_files(id, data) {
  if (printers[id]['files'] == undefined) {
    printers[id]['files'] = []
  }
  $.each(data, function (i, f) {
    if (f.type === 0) {
      getPrinterFiles(id, f.name)
    } else {
      printers[id]['files'].push(f.name)
      createTable('Files', [f.name])
    }
  })
}


function addPrinters(printers) {
  $.each(printers, function (id, printer) {
    var template = $("#tmplPrintersListItem").html()
    var item = $(template)
    var printerIcon = (printer.brand + '_' + printer.model).split(" ").join("").toLowerCase()
    item.attr('id', 'printer_' + id)
    item.attr("data-connection-id", printer.connection)
    item.attr("data-printer-id", id)
    item.find(".printerName").text(printer.name)
    item.find(".printerType").text(printer.brand + ' ' + printer.model)
    item.find(".printerIcon").attr("src", 'img/' + printerIcon + '.webp')
    item.on('click', function () {
      // $.each($('.printerListItem'), function () {
      //   $(this).removeClass('active')
      // })
      // $(this).addClass('active')
      showPrinter($(this).data('printer-id'))
    })
    $("#printersList").append(item)
    socket.emit("printer_info", { id: id })
  });
}

function showPrinter(id) {
  //console.log(JSON.stringify(printers[id]))
  var p = printers[id]
  var printerIcon = (p.brand + '_' + p.model).split(" ").join("").toLowerCase()
  $('#printerName').text(p.name)
  $('#printerType').text(p.brand + ' ' + p.model)
  $("#printerIcon").attr("src", 'img/' + printerIcon + '.webp')

  createTable('Status', p.status, true)
  createTable('Attributes', p.attributes)
  createTable('Print', p.status.PrintInfo)
  
  // only get files once
  if (printers[id]['files'] == undefined) {
    getPrinterFiles(id, '/local')
    if (p.attributes.UsbDiskStatus == 1) {
      getPrinterFiles(id, '/usb')
    }
  }
}

function createTable(name, data, active = false) {
  if ($('#tab-'+name).length == 0) {
    var tTab = $("#tmplNavTab").html()
    var tab = $(tTab)
    tab.find('button').attr('id', 'tab-'+name)
    tab.find('button').attr('data-bs-target', '#tab'+name)
    tab.find('button').text(name)
    if(active) {
      tab.find('button').addClass('active')
    }
    $('#navTabs').append(tab)
  }

  if ($('#tab'+name).length == 0) {
    var tPane = $("#tmplNavPane").html()
    var pane = $(tPane)
    pane.attr('id', 'tab'+name)
    pane.find('tbody').attr('id', 'table'+name)
    if(active) {
      pane.addClass('active')
    }
    $('#navPanes').append(pane)
  }
  fillTable(name, data)
}

function fillTable(table, data) {
  var t = $('#table'+table)
  $.each(data, function (key, val) {
    if (typeof val === 'object') {
      val = JSON.stringify(val)
    }
    var row = $('<tr><td>' + key + '</td><td>' + val + '</td></tr>')
    t.append(row)
  })
}

function getPrinterFiles(id, url) {
  socket.emit("printer_files", { id: id, url: url })
}

function updatePrinterStatus(data) {
  var info = $('#printer_' + data.MainboardID).find('.printerInfo')
  switch (data.Status.CurrentStatus[0]) {
    case SDCP_MACHINE_STATUS_IDLE:
      info.text("Idle")
      updatePrinterStatusIcon(data.MainboardID, "success", false)
      break
    case SDCP_MACHINE_STATUS_PRINTING:
      info.text("Printing")
      updatePrinterStatusIcon(data.MainboardID, "primary", true)
      break
    case SDCP_MACHINE_STATUS_FILE_TRANSFERRING:
      info.text("File Transfer")
      updatePrinterStatusIcon(data.MainboardID, "warning", true)
      break
    case SDCP_MACHINE_STATUS_EXPOSURE_TESTING:
      info.text("Exposure Test")
      updatePrinterStatusIcon(data.MainboardID, "info", true)
      break
    case SDCP_MACHINE_STATUS_DEVICES_TESTING:
      info.text("Device Self-Test")
      updatePrinterStatusIcon(data.MainboardID, "warning", true)
      break
    default:
      break
  }
}

function updatePrinterStatusIcon(id, style, spinner) {
  var el = 'printerStatus'
  if (spinner) {
    el = 'printerSpinner'
    $('.printerStatus').addClass('visually-hidden')
    $('.printerSpinner').removeClass('visually-hidden')
  } else {
    $('.printerStatus').removeClass('visually-hidden')
    $('.printerSpinner').addClass('visually-hidden')
  }
  var status = $('#printer_' + id).find('.' + el)
  status.removeClass(function (index, css) {
    return (css.match(/\btext-\S+/g) || []).join(' ');
  }).addClass("text-" + style);
  status.find('i').removeClass().addClass('bi-circle-fill')
}

function setServerStatus(online) {
  serverStatus = $('.serverStatus')
  if (online) {
    serverStatus.removeClass('bi-cloud text-danger').addClass('bi-cloud-check-fill')
  } else {
    serverStatus.removeClass('bi-cloud-check-fill').addClass('bi-cloud text-danger')
  }
}

$('.serverStatus').on("mouseenter", function (e) {
  if ($(this).hasClass('bi-cloud-check-fill')) {
    $(this).removeClass('bi-cloud-check-fill').addClass('bi-cloud-plus text-primary')
  }
});
$('.serverStatus').on("mouseleave", function (e) {
  $(this).removeClass('bi-cloud-plus text-primary').addClass('bi-cloud-check-fill')
});
$('.serverStatus').on('click', function (e) {
  socket.emit("printers", "{}")
});

/* global bootstrap: false */
(() => {
  'use strict'
  const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    new bootstrap.Tooltip(tooltipTriggerEl)
  })
})()
