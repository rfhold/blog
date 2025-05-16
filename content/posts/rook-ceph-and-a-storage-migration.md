+++
title = 'Rook Ceph & Valero Storage Migration'
date = 2025-05-11
draft = true
tags = ['kubernetes', 'storage', 'ceph', 'rook-ceph', 'software', 'pvc', 'valero']
categories = ['kubernetes', 'homelab', 'web']
+++
I've been unsure of how I wanted to operate my homelab in terms of hosts, virtualization, storage, and backups. I've identified a solution that fits my needs, but I will need to migrate away from my existing Longhorn based storage, forcing me to fully implement backups and migrations into my deployments.

## Overview
First I need to configure the destination Ceph cluster. The first host I will be doing this to is easy because I already have the intended 4 drives unused for Ceph to allocate fore OSDs. I used Helm to install rook-ceph for CRDs and drivers then a "default" rook-ceph-cluster.

I only have one node for each of my clusters so I'm setting my filesystem failure domain to `osd` opposed to the default of `host`. I can squeeze a little more performance from nvme drives
