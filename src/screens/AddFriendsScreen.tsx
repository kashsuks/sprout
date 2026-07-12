import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { avatarColorFor, colors } from '@/theme/colors';
import { fonts, textStyles } from '@/theme/typography';
import { Screen } from '@/components/Screen';
import {
  useAcceptFriendRequest,
  useBlockedUsers,
  useBlockUser,
  useDeclineFriendRequest,
  useFriends,
  useFriendSearch,
  useIncomingRequests,
  useOutgoingRequests,
  useSendFriendRequest,
  useUnfriend,
  type BlockedUser,
  type Friend,
  type FriendRequest,
} from '@/api/hooks/friends';
import { useUserProfile } from '@/api/hooks/users';
import { useAuthStore } from '@/store/useAuthStore';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';

const POLL_INTERVAL_MS = 15000;

const STATUS_LABEL: Record<string, string> = {
  none: 'add',
  friends: 'friends',
  pending_outgoing: 'pending',
  pending_incoming: 'respond below',
};

function IncomingRequestRow({ request }: { request: FriendRequest }) {
  const { data } = useUserProfile(request.requestedBy);
  const accept = useAcceptFriendRequest();
  const decline = useDeclineFriendRequest();
  const block = useBlockUser();
  const user = data?.user;
  if (!user) return null;

  function confirmBlock() {
    Alert.alert(`Block ${user!.displayName}?`, 'They won’t be able to find you or send requests.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => block.mutate(user!._id) },
    ]);
  }

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: avatarColorFor(user.username) }]}>
        <Text style={styles.avatarText}>{user.displayName[0]?.toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{user.displayName}</Text>
      <View style={styles.requestActions}>
        <Pressable style={styles.acceptBtn} disabled={accept.isPending} onPress={() => accept.mutate(request._id)}>
          <Text style={styles.acceptBtnText}>accept</Text>
        </Pressable>
        <Pressable style={styles.declineBtn} disabled={decline.isPending} onPress={() => decline.mutate(request._id)}>
          <Text style={styles.declineBtnText}>decline</Text>
        </Pressable>
        <Pressable style={styles.declineBtn} disabled={block.isPending} onPress={confirmBlock}>
          <Text style={styles.declineBtnText}>block</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FriendRow({ friend }: { friend: Friend }) {
  const unfriend = useUnfriend();
  const block = useBlockUser();

  function confirmUnfriend() {
    Alert.alert(`Unfriend ${friend.displayName}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unfriend', style: 'destructive', onPress: () => unfriend.mutate(friend.friendshipId) },
    ]);
  }

  function confirmBlock() {
    Alert.alert(`Block ${friend.displayName}?`, 'This also unfriends them. They won’t be able to find you or send requests.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => block.mutate(friend._id) },
    ]);
  }

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: avatarColorFor(friend.username) }]}>
        <Text style={styles.avatarText}>{friend.displayName[0]?.toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{friend.displayName}</Text>
      <View style={styles.requestActions}>
        <Pressable style={styles.declineBtn} disabled={unfriend.isPending} onPress={confirmUnfriend}>
          <Text style={styles.declineBtnText}>unfriend</Text>
        </Pressable>
        <Pressable style={styles.declineBtn} disabled={block.isPending} onPress={confirmBlock}>
          <Text style={styles.declineBtnText}>block</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BlockedRow({ user }: { user: BlockedUser }) {
  const unblock = useUnfriend();

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: avatarColorFor(user.username) }]}>
        <Text style={styles.avatarText}>{user.displayName[0]?.toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{user.displayName}</Text>
      <Pressable style={styles.declineBtn} disabled={unblock.isPending} onPress={() => unblock.mutate(user.friendshipId)}>
        <Text style={styles.declineBtnText}>unblock</Text>
      </Pressable>
    </View>
  );
}

function OutgoingRequestRow({ request, myId }: { request: FriendRequest; myId: string }) {
  const otherId = request.userA === myId ? request.userB : request.userA;
  const { data } = useUserProfile(otherId);
  const user = data?.user;
  if (!user) return null;

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: avatarColorFor(user.username) }]}>
        <Text style={styles.avatarText}>{user.displayName[0]?.toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{user.displayName}</Text>
      <Text style={styles.pendingLabel}>pending</Text>
    </View>
  );
}

export default function AddFriendsScreen() {
  const mongoUser = useAuthStore((s) => s.mongoUser);
  const [query, setQuery] = useState('');
  const [blockedOpen, setBlockedOpen] = useState(false);
  const { data: searchData, isFetching: searching, refetch: refetchSearch } = useFriendSearch(query);
  // Polls so an incoming request shows up (with accept/decline) without
  // having to leave and reopen this screen.
  const { data: incomingData, refetch: refetchIncoming } = useIncomingRequests({ refetchInterval: POLL_INTERVAL_MS });
  const { data: outgoingData, refetch: refetchOutgoing } = useOutgoingRequests();
  const { data: friendsData, refetch: refetchFriends } = useFriends();
  const { data: blockedData, refetch: refetchBlocked } = useBlockedUsers();
  const sendRequest = useSendFriendRequest();

  useRefetchOnFocus(refetchIncoming);
  useRefetchOnFocus(refetchOutgoing);
  useRefetchOnFocus(refetchFriends);
  useRefetchOnFocus(refetchBlocked);

  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    const refetches: Promise<unknown>[] = [refetchIncoming(), refetchOutgoing(), refetchFriends(), refetchBlocked()];
    if (query.trim().length > 0) refetches.push(refetchSearch());
    await Promise.all(refetches);
    setRefreshing(false);
  }

  const results = searchData?.users ?? [];
  const incoming = incomingData?.requests ?? [];
  const outgoing = outgoingData?.requests ?? [];
  const friends = friendsData?.friends ?? [];
  const blocked = blockedData?.blocked ?? [];

  return (
    <Screen contentStyle={{ paddingTop: 4 }} refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={[textStyles.appLogo, { color: colors.ink, marginBottom: 12 }]}>add friends</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="search by username"
        placeholderTextColor={colors.inkSoft}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      {searching ? (
        <ActivityIndicator color={colors.stamp} style={{ marginVertical: 12 }} />
      ) : query.trim().length > 0 && results.length === 0 ? (
        <Text style={styles.emptyHint}>no users found</Text>
      ) : (
        results.map((u) => (
          <View key={u._id} style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: avatarColorFor(u.username) }]}>
              <Text style={styles.avatarText}>{u.displayName[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{u.displayName}</Text>
            <Pressable
              style={[styles.addBtn, u.status !== 'none' && styles.addBtnDisabled]}
              disabled={u.status !== 'none' || sendRequest.isPending}
              onPress={() => sendRequest.mutate(u._id)}
            >
              <Text style={styles.addBtnText}>{STATUS_LABEL[u.status]}</Text>
            </Pressable>
          </View>
        ))
      )}

      {incoming.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>requests</Text>
          {incoming.map((r) => (
            <IncomingRequestRow key={r._id} request={r} />
          ))}
        </>
      )}

      {outgoing.length > 0 && mongoUser && (
        <>
          <Text style={styles.sectionLabel}>sent</Text>
          {outgoing.map((r) => (
            <OutgoingRequestRow key={r._id} request={r} myId={mongoUser._id} />
          ))}
        </>
      )}

      {friends.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>your friends</Text>
          {friends.map((f) => (
            <FriendRow key={f._id} friend={f} />
          ))}
        </>
      )}

      <Pressable style={styles.blockedToggle} onPress={() => setBlockedOpen((v) => !v)}>
        <Text style={styles.blockedToggleText}>blocked ({blocked.length})</Text>
        <Text style={styles.blockedToggleText}>{blockedOpen ? '▾' : '▸'}</Text>
      </Pressable>
      {blockedOpen &&
        (blocked.length === 0 ? (
          <Text style={styles.emptyHint}>no one blocked</Text>
        ) : (
          blocked.map((u) => <BlockedRow key={u._id} user={u} />)
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  emptyHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkSoft, marginBottom: 12 },
  sectionLabel: { ...textStyles.eyebrow, color: colors.inkSoft, marginTop: 16, marginBottom: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 9,
    marginBottom: 9,
  },
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 11, color: colors.white },
  name: { flex: 1, fontFamily: fonts.monoBold, fontSize: 11, color: colors.ink },

  addBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.stamp,
    borderStyle: 'dashed',
  },
  addBtnDisabled: { opacity: 0.5, borderStyle: 'solid' },
  addBtnText: { fontFamily: fonts.mono, fontSize: 9, color: colors.stamp },

  requestActions: { flexDirection: 'row', gap: 6 },
  acceptBtn: { backgroundColor: colors.forest, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 9 },
  acceptBtnText: { fontFamily: fonts.mono, fontSize: 9, color: colors.white },
  declineBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 9 },
  declineBtnText: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft },

  pendingLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkSoft },

  blockedToggle: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
    paddingVertical: 10,
    paddingHorizontal: 2,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blockedToggleText: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft },
});
