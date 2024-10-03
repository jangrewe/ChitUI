<?php

$printersJson = 'printers.json';

$output = '{"msg": "Nothing to see here..."}';
if (isset($_GET['get'])) {
  switch ($_GET['get']) {
    case 'printers':
      if (file_exists($printersJson)) {
        $output = file_get_contents($printersJson);
      } else {
        $output = discoverPrinters();
      }
      break;
    default:
      break;
  }
} elseif (isset($_GET['action'])) {
  switch ($_GET['action']) {
    case 'discover':
      $output = discoverPrinters();
      break;
    default:
      break;
  }
}
header('Content-Type: application/json; charset=utf-8');
echo $output;
die;

function savePrinterInfo($response) {
    global $printersJson;

    $printers = new stdClass();
    if (file_exists($printersJson)) {
      $printers = json_decode(file_get_contents($printersJson));
    }
    $info = json_decode($response);
    $data = $info->Data;
    $id = $info->Id;
    $printer = array(
      'name' => $data->Name,
      'model' => $data->MachineName,
      'brand' => $data->BrandName,
      'ip'  => $data->MainboardIP,
      'mainboard'  => $data->MainboardID,
      'protocol' => $data->ProtocolVersion,
      'firmware' => $data->FirmwareVersion,
    );
    $printers->$id = $printer;
    if (file_put_contents($printersJson, json_encode($printers, JSON_PRETTY_PRINT))) {
      return true;
    }
    return false;
}

function discoverPrinters() {
  global $printersJson;
  $socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
  $sockets = array($socket);
  $null = NULL;
  $socketTimeout = 3;
  $socketOpen = true;
  $msg = "M99999";

  socket_set_option($socket, SOL_SOCKET, SO_BROADCAST, 1);
  socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, 1);
  socket_set_option($socket, SOL_SOCKET, SO_REUSEPORT, 1);
  socket_set_option($socket, SOL_SOCKET, SO_RCVTIMEO, array("sec"=>$socketTimeout, "usec"=>0));
  socket_bind($socket, '0.0.0.0');
  socket_sendto($socket, $msg, strlen($msg), 0, '255.255.255.255', 3000);
  
  while($socketOpen) {
    if (socket_recv($socket, $data, 9999, 0)) {
      //echo "Response received: ".$data.PHP_EOL;
      savePrinterInfo($data);
    }
    $socketOpen = socket_select($sockets, $null, $null, $socketTimeout);
  }
  if (file_exists($printersJson)) {
    return file_get_contents($printersJson);
  } else {
    return "{}";
  }
}
