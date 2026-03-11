import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import globalize from '../../../../lib/globalize';
import loading from '../../../../components/loading/loading';
import Page from '../../../../components/Page';
import SectionTabs from '../../../../components/dashboard/users/SectionTabs';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import Button from '../../../../elements/emby-button/Button';
import {
    useAdminGetUserFriends,
    useAdminAddFriendship,
    useAdminRemoveFriendship,
    type FriendDto
} from '../../../experimental/features/friends/api/useFriends';

const AdminUserFriends = () => {
    const [ searchParams ] = useSearchParams();
    const userId = searchParams.get('userId');

    const [ userName, setUserName ] = useState('');
    const [ allUsers, setAllUsers ] = useState<UserDto[]>([]);
    const [ selectedFriendId, setSelectedFriendId ] = useState('');
    const [ error, setError ] = useState('');

    const element = useRef<HTMLDivElement>(null);

    const { data: friends = [], isLoading, refetch } = useAdminGetUserFriends(userId);
    const addFriendship = useAdminAddFriendship(userId);
    const removeFriendship = useAdminRemoveFriendship(userId);

    // Load user name and full user list for the add-friend selector
    useEffect(() => {
        if (!userId) return;

        loading.show();

        Promise.all([
            window.ApiClient.getUser(userId),
            window.ApiClient.getUsers()
        ]).then(([user, users]) => {
            setUserName(user.Name ?? '');
            // Exclude the edited user from the picker
            setAllUsers(users.filter(u => u.Id !== userId));
            loading.hide();
        }).catch(err => {
            console.error('[adminuserfriends] failed to load data', err);
            loading.hide();
        });
    }, [userId]);

    const handleAdd = useCallback(() => {
        if (!selectedFriendId) return;
        setError('');

        addFriendship.mutate(selectedFriendId, {
            onSuccess: () => {
                setSelectedFriendId('');
                refetch();
            },
            onError: (err: unknown) => {
                const msg = err instanceof Error ? err.message : 'Failed to add friendship.';
                setError(msg);
            }
        });
    }, [selectedFriendId, addFriendship, refetch]);

    const handleRemove = useCallback((friendId: string) => {
        setError('');

        removeFriendship.mutate(friendId, {
            onSuccess: () => {
                refetch();
            },
            onError: (err: unknown) => {
                const msg = err instanceof Error ? err.message : 'Failed to remove friendship.';
                setError(msg);
            }
        });
    }, [removeFriendship, refetch]);
    const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFriendId(e.target.value);
    }, []);

    const handleRemoveClick = useCallback((friendId: string) => {
        handleRemove(friendId);
    }, [handleRemove]);

    // Users already friends — exclude them from the add picker
    const friendIds = new Set(friends.map((f: FriendDto) => f.UserId));
    const availableUsers = allUsers.filter(u => u.Id && !friendIds.has(u.Id));

    return (
        <Page
            id='adminUserFriendsPage'
            className='mainAnimatedPage type-interior'
        >
            <div ref={element} className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer title={userName} />
                </div>

                <SectionTabs activeTab='userfriends' />

                <div className='verticalSection' style={{ marginTop: '1em' }}>
                    <h2 className='sectionTitle'>
                        {globalize.translate('HeaderFriends')}
                    </h2>

                    {error && (
                        <div className='fieldDescription' style={{ color: 'var(--color-error, #e74c3c)', marginBottom: '1em' }}>
                            {error}
                        </div>
                    )}

                    {/* Add friend */}
                    <div style={{
                        display: 'flex',
                        gap: '0.75em',
                        alignItems: 'center',
                        marginBottom: '1.5em',
                        flexWrap: 'wrap',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1.5em',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <select
                            className='selectBox'
                            value={selectedFriendId}
                            onChange={handleSelectChange}
                            disabled={addFriendship.isPending}
                            style={{
                                flex: '1',
                                minWidth: '200px',
                                background: 'rgba(0,0,0,0.3)',
                                color: 'inherit',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                fontSize: '1rem',
                                outline: 'none',
                                appearance: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value=''>
                                {globalize.translate('LabelSelectUser')}
                            </option>
                            {availableUsers.map(u => (
                                <option key={u.Id} value={u.Id ?? ''} style={{ background: '#222', color: '#fff' }}>
                                    {u.Name}
                                </option>
                            ))}
                        </select>
                        <Button
                            type='button'
                            className='raised button-submit'
                            title={globalize.translate('ButtonAddFriend')}
                            onClick={handleAdd}
                            disabled={!selectedFriendId || addFriendship.isPending}
                            style={{ padding: '0.5em 2em' }}
                        />
                    </div>

                    {/* Friends list */}
                    {isLoading ? (
                        <p>{globalize.translate('Loading')}</p>
                    ) : (
                        <div className='paperList'>
                            {friends.length === 0 ? (
                                <p className='fieldDescription' style={{ padding: '1em' }}>
                                    {globalize.translate('MessageNoFriendsFound')}
                                </p>
                            ) : (
                                friends.map((friend: FriendDto) => (
                                    <FriendRow
                                        key={friend.UserId}
                                        friend={friend}
                                        onRemove={handleRemoveClick}
                                        isPending={removeFriendship.isPending}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Page>
    );
};

const FriendRow = ({ friend, onRemove, isPending }: { friend: FriendDto, onRemove: (id: string) => void, isPending: boolean }) => {
    const handleRemove = useCallback(() => {
        onRemove(friend.UserId);
    }, [friend.UserId, onRemove]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75em 1em',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em' }}>
                <div
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: friend.IsOnline ? 'var(--color-online, #2ecc71)' : 'var(--color-offline, #888)',
                        flexShrink: 0,
                        boxShadow: friend.IsOnline ? '0 0 8px #2ecc71' : 'none'
                    }}
                />
                <span style={{ fontWeight: 500 }}>{friend.Username}</span>
            </div>
            <Button
                type='button'
                className='raised button-cancel'
                title={globalize.translate('ButtonRemoveFriend')}
                onClick={handleRemove}
                disabled={isPending}
            />
        </div>
    );
};

export default AdminUserFriends;
